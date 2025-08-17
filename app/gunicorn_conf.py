import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
threads = 2
keepalive = 30
timeout = 60
accesslog = "-"
errorlog = "-"
loglevel = "info"
forwarded_allow_ips = "*"