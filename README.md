# ⚛ Quantum vs Classical Benchmark

A production-quality web application that benchmarks **Grover's Quantum Search Algorithm O(√n)** against classical **Linear Search O(n)** in real time, powered by Qiskit and Flask.

---

## ✨ Features

- 🔬 **Live Qiskit simulation** via Qiskit Aer backend  
- 📊 **Interactive Chart.js graphs** — single run (bar) + multi-run scaling (line)  
- 🎞 **Algorithm visualizer** — sequential scan animation vs quantum superposition phases  
- 🎛 **Configurable array size** slider (100 → 50,000)  
- 🔄 **Multi-run mode** — benchmarks across 8 array sizes for scaling comparison  
- 🌌 **Premium dark UI** with glassmorphism, glow effects, particle background  
- 📱 **Fully responsive** (desktop + mobile)

---

## 🗂 Project Structure

```
quantum-vs-classical/
├── app.py                  # Flask backend (API)
├── main.py                 # CLI benchmark runner
├── index.html              # Frontend entry point
│
├── classical/
│   └── linear_search.py    # O(n) linear search
│
├── quantum/
│   └── grover.py           # Grover's algorithm (Qiskit, variable qubits)
│
├── utils/
│   └── plot.py             # Matplotlib plotter (for CLI mode)
│
└── static/
    ├── css/
    │   └── style.css       # Premium dark UI styles
    └── js/
        └── script.js       # Interactive frontend logic
```

---

## 🚀 Local Setup

### 1. Install Python dependencies

```bash
pip install flask flask-cors qiskit qiskit-aer
```

### 2. Start the Flask backend

```bash
python app.py
```

The API will be available at `http://127.0.0.1:5000`.

### 3. Open the frontend

Flask serves `index.html` automatically — just visit:

```
http://127.0.0.1:5000
```

---

## 🔌 API Endpoints

| Method | Endpoint      | Description |
|--------|---------------|-------------|
| GET    | `/run`        | Single benchmark. Params: `?size=10000` |
| GET    | `/multi-run`  | Benchmark across 8 array sizes for scaling graph |

### Example `/run` response

```json
{
  "success": true,
  "size": 10000,
  "classical_time": 0.8214,
  "quantum_time": 312.5,
  "speedup": 0.003,
  "n_qubits": 4,
  "classical_complexity": "O(n) ≈ O(10000)",
  "quantum_complexity": "O(√n) ≈ O(100)",
  "counts": { "0000 1111": 987, "0101 1010": 37 }
}
```

> **Note:** At small scales, the Qiskit simulator overhead means quantum appears *slower*. The quadratic advantage is theoretical and becomes apparent at massive (millions+) scale on real quantum hardware.

---

## ⚙️ How It Works

### Classical Search — O(n)
Iterates through an array element by element until the target is found. Worst case examines all `n` elements.

### Grover's Algorithm — O(√n)
1. **Hadamard** gates put all `n = 2^q` states into uniform superposition  
2. **Oracle** applies a phase flip to the target state  
3. **Diffusion operator** amplifies the target's probability amplitude  
4. Steps 2–3 repeat ≈ π/4 · √n times  
5. **Measurement** collapses to the target with high probability

---

## 🚢 Deployment

### Backend → Render

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Start Command**: `gunicorn app:app`
4. Add `gunicorn` to your `requirements.txt`

### Frontend → Vercel (optional static export)

Since the frontend is served by Flask, the simplest approach is to deploy the full Flask app on Render. For a static-only CDN deployment:

1. Copy `index.html` and `static/` to a separate repo  
2. Change `const API = '...'` in `script.js` to your Render backend URL  
3. Deploy to [Vercel](https://vercel.com) as a static site

---

## 📦 Requirements

```
flask
flask-cors
qiskit
qiskit-aer
```

---

## 📄 License

MIT
