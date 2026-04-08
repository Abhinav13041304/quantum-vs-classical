from qiskit import QuantumCircuit
from qiskit_aer import Aer
import time
import math


def build_grover_circuit(n_qubits: int) -> QuantumCircuit:
    """Build a Grover's algorithm circuit for n_qubits."""
    qc = QuantumCircuit(n_qubits)

    # Step 1: Apply Hadamard to all qubits (superposition)
    qc.h(range(n_qubits))

    # Number of Grover iterations ≈ π/4 * sqrt(N)
    N = 2 ** n_qubits
    iterations = max(1, int(round(math.pi / 4 * math.sqrt(N))))

    for _ in range(iterations):
        # Oracle: mark |11...1> (all ones state)
        qc.h(n_qubits - 1)
        qc.mcx(list(range(n_qubits - 1)), n_qubits - 1)
        qc.h(n_qubits - 1)

        # Diffusion operator (inversion about average)
        qc.h(range(n_qubits))
        qc.x(range(n_qubits))
        qc.h(n_qubits - 1)
        qc.mcx(list(range(n_qubits - 1)), n_qubits - 1)
        qc.h(n_qubits - 1)
        qc.x(range(n_qubits))
        qc.h(range(n_qubits))

    qc.measure_all()
    return qc


def grover_search(n_qubits: int = 2):
    """
    Run Grover's algorithm simulation.
    Returns (counts, elapsed_time_seconds).
    """
    start_time = time.time()

    qc = build_grover_circuit(n_qubits)

    simulator = Aer.get_backend('aer_simulator')
    job = simulator.run(qc, shots=1024)
    result = job.result()
    counts = result.get_counts()

    end_time = time.time()
    return counts, end_time - start_time