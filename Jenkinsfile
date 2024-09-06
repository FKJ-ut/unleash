pipeline { 
    agent any

    stages { 
        stage('Checkout') { 
            steps { 
                git branch: 'main', url: 'https://github.com/FKJ-ut/unleash' 
            } 
        }
        stage('Verify Gradle Version') {
    steps {
        powershell 'gradle -v'
    }
}

stage('Verify Java Version') {
    steps {
        powershell 'java -version'
    }
}


        stage('Install Yarn') { 
            steps { 
                bat 'yarn install' 
            } 
        } 
        stage('Install Yarn Frontend') { 
            steps { 
                bat 'gradle runYarnInstallFrontend' 
            } 
        } 
        stage('Database Setup') { 
            steps { 
                bat 'gradle runDatabase' 
            } 
        } 
        stage('Execute Database') { 
            steps { 
                bat 'gradle executeDatabase' 
            } 
        } 
        stage('Build') { 
            steps { 
                bat 'gradle runBuild' 
            } 
        } 
        stage('Deploy Unleash') { 
            steps { 
                bat 'gradle runUnleash' 
            } 
        } 
    } 
    post { 
        always { 
            echo 'Cleaning up workspace' 
            deleteDir() // Clean up the workspace after the build 
        } 
        success { 
            echo 'Build succeeded!!!' 
            // Add notification steps here if needed 
        } 
        failure { 
            echo 'Build failed!' 
            // Add failure handling or notification steps here 
        } 
    } 
}
