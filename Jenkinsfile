pipeline {
    agent any

    environment {
        // SSH 접속 정보를 변수로 관리
        HOST_USER = 'ubuntu'      // 호스트 머신 사용자 이름
        HOST_IP = '172.17.0.1'
        PROJECT_DIR = '/home/ubuntu/udong'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out dev branch from GitLab...'
                checkout scm
            }
        }

        stage('Detect Changes') {
            steps {
                script {
                    echo "Detecting changed files..."
                    // 최초 커밋 등 히스토리가 1개일 때 오류 방지를 위해 || echo "all" 추가
                    def changedFiles = sh(
                        script: 'git diff --name-only HEAD~1 HEAD || echo "all"',
                        returnStdout: true
                    ).trim()
                    
                    echo "Changed files: ${changedFiles}"
                    
                    env.FRONTEND_CHANGED = (changedFiles.contains('frontend/') || changedFiles == 'all') ? 'true' : 'false'
                    env.BUSINESS_CHANGED = (changedFiles.contains('backend/business/') || changedFiles == 'all') ? 'true' : 'false'
                    env.CHAT_CHANGED = (changedFiles.contains('backend/chatting/') || changedFiles == 'all') ? 'true' : 'false'
                    
                    echo "Frontend changed: ${env.FRONTEND_CHANGED}"
                    echo "Business API changed: ${env.BUSINESS_CHANGED}"
                    echo "Chat API changed: ${env.CHAT_CHANGED}"
                    
                    // 변경된 서비스가 없으면 마지막 커밋이 Jenkinsfile 수정 등일 수 있으므로 전체 배포
                    if (!changedFiles.contains('frontend/') && !changedFiles.contains('backend/business/') && !changedFiles.contains('backend/chatting/')) {
                        env.FRONTEND_CHANGED = 'true'
                        env.BUSINESS_CHANGED = 'true'
                        env.CHAT_CHANGED = 'true'
                        echo "No specific service changes detected, deploying all services"
                    }
                }
            }
        }

        stage('Git Pull') {
            steps {
                echo 'Pulling latest changes from GitLab...'
                sshagent(credentials: ['host-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${HOST_USER}@${HOST_IP} '''
                            set -e
                            echo "--- Pulling latest changes ---"
                            cd ${PROJECT_DIR}
                            git config pull.rebase false
                            git pull
                        '''
                    """
                }
            }
        }

        // 먼저 .env 파일 준비 (Business API 변경 시에만)
        stage('Prepare Environment') {
            when {
                environment name: 'BUSINESS_CHANGED', value: 'true'
            }
            steps {
                echo 'Preparing environment files...'
                withCredentials([file(credentialsId: 'business-api-env', variable: 'ENV_FILE')]) {
                    sshagent(credentials: ['host-ssh-key']) {
                        sh """
                            set -e
                            echo "--- Copying .env file to host ---"
                            scp -o StrictHostKeyChecking=no \${ENV_FILE} ${HOST_USER}@${HOST_IP}:${PROJECT_DIR}/backend/business/.env
                            echo "Environment file copied successfully"
                        """
                    }
                }
            }
        }

        // 이제 병렬 빌드 (env 파일이 이미 준비됨)
        stage('Deploy Services') {
            parallel {
                stage('Deploy Frontend') {
                    when {
                        environment name: 'FRONTEND_CHANGED', value: 'true'
                    }
                    steps {
                        echo 'Building and deploying Frontend...'
                        sshagent(credentials: ['host-ssh-key']) {
                            // Docker Build
                            sh """
                                ssh -o StrictHostKeyChecking=no ${HOST_USER}@${HOST_IP} '''
                                    set -e
                                    echo "--- Building Frontend ---"
                                    cd ${PROJECT_DIR}
                                    if ! docker-compose build --no-cache frontend; then
                                        echo "Frontend build failed!"
                                        docker-compose logs frontend || true
                                        exit 1
                                    fi
                                    echo "Frontend build successful!"
                                '''
                            """
                            
                            // Deploy
                            sh """
                                ssh -o StrictHostKeyChecking=no ${HOST_USER}@${HOST_IP} '''
                                    set -e
                                    echo "--- Deploying Frontend ---"
                                    cd ${PROJECT_DIR}
                                    docker-compose up -d --no-deps frontend
                                    echo "Frontend deployment completed!"
                                '''
                            """
                        }
                        echo 'Frontend deployment pipeline completed!'
                    }
                }
                
                stage('Deploy Business API') {
                    when {
                        environment name: 'BUSINESS_CHANGED', value: 'true'
                    }
                    steps {
                        echo 'Building and deploying Business API...'
                        sshagent(credentials: ['host-ssh-key']) {
                            // Docker Build (.env 파일이 이미 준비되어 있음)
                            sh """
                                ssh -o StrictHostKeyChecking=no ${HOST_USER}@${HOST_IP} '''
                                    set -e
                                    echo "--- Building Business API ---"
                                    cd ${PROJECT_DIR}
                                    if ! docker-compose build --no-cache business-api; then
                                        echo "Business API build failed!"
                                        docker-compose logs business-api || true
                                        exit 1
                                    fi
                                    echo "Business API build successful!"
                                '''
                            """
                            
                            // Deploy
                            sh """
                                ssh -o StrictHostKeyChecking=no ${HOST_USER}@${HOST_IP} '''
                                    set -e
                                    echo "--- Deploying Business API ---"
                                    cd ${PROJECT_DIR}
                                    docker-compose up -d --no-deps business-api
                                    echo "Business API deployment completed!"
                                '''
                            """
                        }
                        echo 'Business API deployment pipeline completed!'
                    }
                }
                
                stage('Deploy Chat API') {
                    when {
                        environment name: 'CHAT_CHANGED', value: 'true'
                    }
                    steps {
                        echo 'Building and deploying Chat API...'
                        sshagent(credentials: ['host-ssh-key']) {
                            // Docker Build
                            sh """
                                ssh -o StrictHostKeyChecking=no ${HOST_USER}@${HOST_IP} '''
                                    set -e
                                    echo "--- Building Chat API ---"
                                    cd ${PROJECT_DIR}
                                    if ! docker-compose build --no-cache chat-api; then
                                        echo "Chat API build failed!"
                                        docker-compose logs chat-api || true
                                        exit 1
                                    fi
                                    echo "Chat API build successful!"
                                '''
                            """
                            
                            // Deploy
                            sh """
                                ssh -o StrictHostKeyChecking=no ${HOST_USER}@${HOST_IP} '''
                                    set -e
                                    echo "--- Deploying Chat API ---"
                                    cd ${PROJECT_DIR}
                                    docker-compose up -d --no-deps chat-api
                                    echo "Chat API deployment completed!"
                                '''
                            """
                        }
                        echo 'Chat API deployment pipeline completed!'
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Cleaning up unused Docker images on host...'
                sshagent(credentials: ['host-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${HOST_USER}@${HOST_IP} '''
                            echo "--- Cleanup ---"
                            docker image prune -f
                            echo "Cleanup completed!"
                        '''
                    """
                }
                echo "Cleanup pipeline completed!"
            }
        }
    }

    post {
        always {
            echo "Pipeline finished at ${new Date()}"
        }
        success {
            echo 'Pipeline executed successfully!'
            // Slack 알림 등을 여기에 추가할 수 있음
        }
        failure {
            echo 'Pipeline failed!'
            // 실패 시 알림 로직을 여기에 추가할 수 있음
            sshagent(credentials: ['host-ssh-key']) {
                sh """
                    ssh -o StrictHostKeyChecking=no ${HOST_USER}@${HOST_IP} '''
                        echo "--- Failure Diagnosis ---"
                        cd ${PROJECT_DIR}
                        echo "Current container status:"
                        docker-compose ps
                        echo "Recent container logs:"
                        docker-compose logs --tail 20
                    ''' || true
                """
            }
        }
        unstable {
            echo 'Pipeline completed with warnings!'
        }
    }
}