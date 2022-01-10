FROM gitpod/workspace-postgres:latest

RUN bash -c ". .nvm/nvm.sh && nvm install 17 && nvm use 17 && nvm alias default 17"

RUN echo "nvm use default &>/dev/null" >> ~/.bashrc.d/51-nvm-fix