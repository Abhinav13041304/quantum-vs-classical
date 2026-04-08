from classical.linear_search import linear_search
from quantum.grover import grover_search
from utils.plot import plot_results

import random

def run_benchmark():
    size = 10000
    arr = list(range(size))
    target = random.choice(arr)

    print("Running Classical Search...")
    index, classical_time = linear_search(arr, target)
    print(f"Found at index {index} in {classical_time:.6f} seconds")

    print("\nRunning Quantum Search...")
    counts, quantum_time = grover_search()
    print(f"Quantum result: {counts}")
    print(f"Time taken: {quantum_time:.6f} seconds")

    plot_results(classical_time, quantum_time)

if __name__ == "__main__":
    run_benchmark()