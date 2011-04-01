# -*- encoding: utf-8 -*-

"""
deployement script
"""

from fabric.api import run, sudo, env
from fabric.context_managers import cd, show, settings
from fabric.contrib.project import upload_project
from fabric.contrib.files import exists

from hosts import *

env.user = 'rambot'
env.password = ''
env.hosts = ['127.0.0.1:2224']
env.deploy_folder = '/home/rambot/whitebrd.me'
env.git_repo = 'https://github.com/javisantana/whitebrd.me'

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
    if not exists(env.deploy_folder + "/app"):
        with cd(env.deploy_folder):
            run("git clone %s app" % env.git_repo)
    else:
        update_files()

    sudo("rm -rf /etc/nginx/nginx.conf")
    sudo("rm -rf /etc/supervisord.conf" % env)
    
    # configuration
    sudo("ln -s %(deploy_folder)s/app/deploy/nginx.conf /etc/nginx/nginx.conf" % env)
    sudo("ln -s %(deploy_folder)s/app/deploy/supervisord.conf /etc/supervisord.conf" % env)

    update_dependencies()


def install_redis():
    redis_url = 'http://redis.googlecode.com/files/redis-2.2.2.tar.gz'
    redis_file = redis_url.split('/')[-1]
    redis_folder = redis_file.split('/')[-1][:-7]
    with cd('/tmp'):
       run("rm -rf " + redis_file)
       run("wget " + redis_url)
       run("tar -xzf " + redis_file)
       with cd(redis_folder):
         run("make")
         sudo("cp src/redis-server /usr/bin")
    sudo("rm -rf /etc/redis.conf")
    sudo("ln -s %(deploy_folder)s/app/deploy/redis.conf /etc/redis.conf" % env)
       

def update_files():
    with cd(env.deploy_folder + "/app"):
        run("git pull")

def deploy():
    """ deploy repo """
    update_files()
    update_dependencies()
    reload()

def reload():
    """ restart services """
    # start supervisord
    with settings(warn_only=True):
        sudo("supervisord")
    sudo("supervisorctl reload") # reload supervisor conf
    sudo("supervisorctl restart tornado")
    sudo("supervisorctl restart redis")
    # nginx
    sudo("invoke-rc.d nginx restart")

def update_dependencies():
    """ update depencies from requirements """
    sudo("%(deploy_folder)s/env/bin/pip install -r %(deploy_folder)s/app/src/requirements.txt" % env)
    
