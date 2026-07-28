import os
import json
import time
import logging
from typing import List, Optional, Union, Any

# Configure logger
logger = logging.getLogger(__name__)

class MockMessage:
    """
    Simulates a message returned by the Kafka Consumer.
    """
    def __init__(self, topic: str, value_bytes: bytes, key_bytes: Optional[bytes] = None):
        self._topic = topic
        self._value = value_bytes
        self._key = key_bytes

    def value(self) -> bytes:
        return self._value

    def key(self) -> Optional[bytes]:
        return self._key

    def topic(self) -> str:
        return self._topic

    def error(self) -> Optional[Any]:
        return None


class SimulatedQueueProducer:
    """
    A simulated broker producer that writes messages to a local file-based queue.
    """
    def __init__(self, queue_dir: str = "data/queue"):
        self.queue_dir = queue_dir
        os.makedirs(self.queue_dir, exist_ok=True)
        logger.info(f"Simulated Queue Producer initialized. Queue directory: {self.queue_dir}")

    def send(self, topic: str, value: str, key: Optional[str] = None):
        """
        Appends the message to data/queue/{topic}.jsonl.
        """
        filepath = os.path.join(self.queue_dir, f"{topic}.jsonl")
        payload = {
            "key": key,
            "value": value,
            "timestamp": time.time()
        }
        
        with open(filepath, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
            
        logger.debug(f"Simulated message sent to topic '{topic}'. Length: {len(value)} bytes.")

    def flush(self):
        # Simulated flush is a no-op
        pass


class SimulatedQueueConsumer:
    """
    A simulated broker consumer that reads from the local file-based queue.
    Tracks consumer group offsets in data/queue/offsets_{group_id}_{topic}.txt.
    """
    def __init__(self, topics: List[str], group_id: str, queue_dir: str = "data/queue"):
        self.topics = topics
        self.group_id = group_id
        self.queue_dir = queue_dir
        os.makedirs(self.queue_dir, exist_ok=True)
        
        # Load offsets for all topics
        self.offsets = {}
        for topic in self.topics:
            self.offsets[topic] = self._load_offset(topic)
            
        logger.info(f"Simulated Queue Consumer initialized for group '{self.group_id}' on topics {self.topics}. Current offsets: {self.offsets}")

    def _get_offset_filepath(self, topic: str) -> str:
        return os.path.join(self.queue_dir, f"offsets_{self.group_id}_{topic}.txt")

    def _load_offset(self, topic: str) -> int:
        filepath = self._get_offset_filepath(topic)
        if os.path.exists(filepath):
            try:
                with open(filepath, "r") as f:
                    return int(f.read().strip())
            except Exception:
                return 0
        return 0

    def _save_offset(self, topic: str, offset: int):
        filepath = self._get_offset_filepath(topic)
        try:
            with open(filepath, "w") as f:
                f.write(str(offset))
        except Exception as e:
            logger.error(f"Failed to save consumer offset for {topic}: {e}")

    def poll(self, timeout: float = 1.0) -> Optional[MockMessage]:
        """
        Polls the topics for new messages. If a new message is found based on the offset,
        returns a MockMessage and increments the offset.
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            for topic in self.topics:
                filepath = os.path.join(self.queue_dir, f"{topic}.jsonl")
                if not os.path.exists(filepath):
                    continue
                    
                # Read all lines
                with open(filepath, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                    
                current_offset = self.offsets[topic]
                if len(lines) > current_offset:
                    # We have a new message!
                    raw_line = lines[current_offset].strip()
                    self.offsets[topic] += 1
                    self._save_offset(topic, self.offsets[topic])
                    
                    if not raw_line:
                        continue
                        
                    try:
                        payload = json.loads(raw_line)
                        val_str = payload.get("value", "")
                        key_str = payload.get("key")
                        
                        val_bytes = val_str.encode("utf-8") if isinstance(val_str, str) else json.dumps(val_str).encode("utf-8")
                        key_bytes = key_str.encode("utf-8") if key_str else None
                        
                        return MockMessage(topic=topic, value_bytes=val_bytes, key_bytes=key_bytes)
                    except Exception as e:
                        logger.error(f"Error parsing queue message at offset {current_offset} on {topic}: {e}")
                        continue
            
            # Sleep briefly to avoid busy-waiting
            time.sleep(0.1)
            
        return None

    def commit(self):
        # Simulated commit is a no-op since we update offset on-the-fly during poll
        pass

    def close(self):
        logger.info(f"Simulated consumer group '{self.group_id}' closed.")


def get_producer() -> Union[SimulatedQueueProducer, Any]:
    """
    Returns a Kafka producer. If KAFKA_BOOTSTRAP_SERVERS is defined,
    attempts to return a real confluent_kafka / kafka-python producer.
    Otherwise, returns a simulated file-backed queue producer.
    """
    bootstrap_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS")
    if bootstrap_servers:
        logger.info(f"KAFKA_BOOTSTRAP_SERVERS set to '{bootstrap_servers}'. Attempting to load real Kafka Producer...")
        try:
            from confluent_kafka import Producer
            conf = {'bootstrap.servers': bootstrap_servers}
            return Producer(conf)
        except ImportError:
            try:
                from kafka import KafkaProducer
                return KafkaProducer(bootstrap_servers=bootstrap_servers.split(','))
            except ImportError:
                logger.warning("Failed to import confluent_kafka or kafka-python. Falling back to Simulated Queue Producer.")
                
    return SimulatedQueueProducer()


def get_consumer(topics: List[str], group_id: str) -> Union[SimulatedQueueConsumer, Any]:
    """
    Returns a Kafka consumer. If KAFKA_BOOTSTRAP_SERVERS is defined,
    attempts to return a real confluent_kafka / kafka-python consumer.
    Otherwise, returns a simulated file-backed queue consumer.
    """
    bootstrap_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS")
    if bootstrap_servers:
        logger.info(f"KAFKA_BOOTSTRAP_SERVERS set to '{bootstrap_servers}'. Attempting to load real Kafka Consumer...")
        try:
            from confluent_kafka import Consumer
            conf = {
                'bootstrap.servers': bootstrap_servers,
                'group.id': group_id,
                'auto.offset.reset': 'earliest'
            }
            consumer = Consumer(conf)
            consumer.subscribe(topics)
            return consumer
        except ImportError:
            try:
                from kafka import KafkaConsumer
                return KafkaConsumer(
                    *topics,
                    bootstrap_servers=bootstrap_servers.split(','),
                    group_id=group_id,
                    auto_offset_reset='earliest'
                )
            except ImportError:
                logger.warning("Failed to import confluent_kafka or kafka-python. Falling back to Simulated Queue Consumer.")
                
    return SimulatedQueueConsumer(topics=topics, group_id=group_id)
