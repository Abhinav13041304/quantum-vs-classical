from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import random
import os

from classical.linear_search import linear_search
from quantum.grover import grover_search

app = Flask(__name__, static_folder="static")
CORS(app)


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/run", methods=["GET"])
def run():
    try:
        import math
        size = int(request.args.get("size", 1000))
        size = max(100, min(size, 50000))  # clamp between 100 and 50k

        arr = list(range(size))
        target = random.choice(arr)

        _, classical_time = linear_search(arr, target)

        # Number of qubits scales with log2(size), capped for performance
        n_qubits = max(2, min(int(math.log2(size)), 5))
        counts, quantum_time = grover_search(n_qubits=n_qubits)

        # Theoretical quantum time = classical * (sqrt(n)/n) ratio
        # i.e., how fast Grover would be on real hardware relative to this classical run
        theoretical_quantum_ms = round(classical_time * 1000 / math.sqrt(size), 4)
        theoretical_speedup    = round(math.sqrt(size), 2)

        return jsonify({
            "success": True,
            "size": size,
            "classical_time": round(classical_time * 1000, 4),      # ms
            "quantum_time":   round(quantum_time * 1000, 4),         # ms (simulator)
            "theoretical_quantum_time": theoretical_quantum_ms,      # ms (real hw estimate)
            "theoretical_speedup": theoretical_speedup,              # √n
            "simulator_speedup": round(classical_time / quantum_time, 2) if quantum_time > 0 else 0,
            "n_qubits": n_qubits,
            "classical_complexity": f"O(n) ≈ O({size:,})",
            "quantum_complexity":   f"O(√n) ≈ O({int(size**0.5):,})",
            "counts": counts,
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/multi-run", methods=["GET"])
def multi_run():
    """Run benchmark across a range of array sizes for graphing."""
    try:
        sizes = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000]
        results = []

        import math
        for size in sizes:
            arr = list(range(size))
            target = random.choice(arr)

            _, classical_time = linear_search(arr, target)
            n_qubits = max(2, min(int(math.log2(size)), 5))
            _, quantum_time = grover_search(n_qubits=n_qubits)

            results.append({
                "size": size,
                "classical_time": round(classical_time * 1000, 4),
                "quantum_time": round(quantum_time * 1000, 4),
                "n_qubits": n_qubits,
            })

        return jsonify({"success": True, "results": results})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)