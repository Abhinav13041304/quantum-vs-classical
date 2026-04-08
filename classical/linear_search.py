import time

def linear_search(arr, target):
    start_time = time.time()
    
    for i in range(len(arr)):
        if arr[i] == target:
            end_time = time.time()
            return i, end_time - start_time

    end_time = time.time()
    return -1, end_time - start_time