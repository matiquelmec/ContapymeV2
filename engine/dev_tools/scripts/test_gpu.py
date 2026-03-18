import torch

def test_gpu():
    print("=== GPU TEST ===")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"Device: {torch.cuda.get_device_name(0)}")
        print(f"VRAM Total: {torch.cuda.get_max_memory_allocated(0)} bytes")
    print("================")

if __name__ == "__main__":
    test_gpu()
