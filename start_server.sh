npx kill-port 8087

node server.mjs 2>&1 | tee serverlogs/server_log_`date +"%Y%m%d_%H%M%S"`.txt
