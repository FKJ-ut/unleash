pipeline { 
    agent any 
    stages { 
        stage('Checkout') { 
            steps { 
                git branch: 'main', url: 'https://github.com/FKJ-ut/unleash' 
            } 
        } 
        stage('Install Yarn') { 
            steps { 
                powershell 'gradle runYarnInstall' 
            } 
        } 
        stage('Install Yarn Frontend') { 
            steps { 
                powershell 'gradle runYarnInstallFrontend' 
            } 
        } 
        stage('Database Setup') { 
            steps { 
                powershell 'gradle runDatabase' 
            } 
        } 
        stage('Execute Database') { 
            steps { 
                powershell 'gradle executeDatabase' 
            } 
        } 
        stage('Build') { 
            steps { 
                powershell 'gradle runBuild' 
            } 
        } 
        stage('Deploy Unleash') { 
            steps { 
                powershell 'gradle runUnleash' 
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
