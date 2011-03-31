# -*- encoding: utf-8 -*-

"""
deployement script
"""

from fabric.api import run, sudo, env
from fabric.context_managers import cd
from fabric.contrib.project import upload_project

env.user = 'rambot'
env.password = 'ramboFTW'
env.hosts = ['127.0.0.1:2223']
env.deploy_folder = '/home/rambot/bbrd.com'
env.git_repo = 'git://...'

def pkg_install(pkg):
    """ install pkg using apt-get """
    sudo("aptitude -y install %s" % pkg)

def install():
    """ install base system on ubuntu machine """
    # apt-get's
    sudo("aptitude update")
    pkgs = ['git-core', 'python-dev', 'build-essential', 'nginx', 'python-setuptools']
    pkg_install(' '.join(pkgs))

    # target folder
    run("mkdir -p %s" % env.deploy_folder)

    # install virtualenv
    sudo("easy_install virtualenv")
    sudo("easy_install pip")
    sudo("pip install supervisor")
    run("virtualenv %s/env" % env.deploy_folder)
    run("%s/env/bin/pip install -U pip" % env.deploy_folder)

    # clone repo
    #with cd(env.deploy_folder):
    #run("git clone %s app" % env.git_repo)
    run("mkdir -p %s/app" % env.deploy_folder)
    with cd(env.deploy_folder + "/app"):
        upload_project()

    sudo("rm -rf /etc/nginx.conf")
    
    # configuration
    sudo("ln -s %(deploy_folder)s/app/deploy/nginx.conf /etc/nginx.conf" % env)
    sudo("ln -s %(deploy_folder)s/app/deploy/supervisord.conf /etc/supervisord.conf" % env)

def update_files():
    #with cd(env.deploy_folder + "/app"):
        upload_project()

def deploy():
    """ deploy repo """
    with cd(env.deploy_folder + "/app"):
        run("git pull")
    update_dependencies()
    reload()

def reload():
    """ restart services """
    sudo("invoke-rc.d nginx restart")
    sudo("supervisorctl restart tornado")

def update_dependencies():
    """ update depencies from requirements """
    sudo("%(deploy_folder)s/env/bin/pip install -r %(deploy_folder)s/app/requirements.txt" % env)
    
