import matplotlib.pyplot as plt

def plot_results(classical_time, quantum_time):
    labels = ['Classical', 'Quantum']
    times = [classical_time, quantum_time]

    plt.bar(labels, times)
    plt.ylabel('Time (seconds)')
    plt.title('Quantum vs Classical Search')
    plt.show()