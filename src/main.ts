import * as core from '@actions/core'
import {SshService} from './service/ssh.service'
import * as fs from 'fs'

async function run(): Promise<void> {
  try {
    const sshService = new SshService()
    const sha8 = core.getInput('sha8')
    let dockerComposeProd = fs.readFileSync(
      `/github/workspace/docker-compose.prod`,
      `utf8`
    )
    dockerComposeProd = dockerComposeProd.replace(':DOCKER_TAG', sha8)
    fs.writeFileSync(`/var/docker-compose.${sha8}.yml`, dockerComposeProd)
    core.debug(new Date().toTimeString())
    core.info(`Writing docker-compose.yml.`)
    core.info(dockerComposeProd)
    await sshService.connect()
    await sshService.putFile(
      `/var/docker-compose.${sha8}.yml`,
      `/home/gha/docker-compose.${sha8}.yml`
    )
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
