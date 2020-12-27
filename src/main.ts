import * as core from '@actions/core'
import {SshService} from './service/ssh.service'
import * as fs from 'fs'

async function run(): Promise<void> {
  try {
    const sshService = new SshService()
    const sha8 = core.getInput('sha8')
    const image = core.getInput('image')
    let dockerComposeProd = fs.readFileSync(
      `${process.env.GITHUB_WORKSPACE}/docker-compose.prod`,
      `utf8`
    )
    dockerComposeProd = dockerComposeProd.replace(':DOCKER_TAG', sha8)
    core.info(`Writing docker-compose.yml.`)
    fs.writeFileSync(
      `${process.env.GITHUB_WORKSPACE}/docker-compose.${sha8}.yml`,
      dockerComposeProd
    )
    await sshService.connect()
    core.info(`Copy file to remote server`)
    await sshService.putFile(
      `${process.env.GITHUB_WORKSPACE}/docker-compose.${sha8}.yml`,
      `/home/gha/docker-compose.${sha8}.yml`
    )

    let response
    core.info(`Pull Image`)
    const region = core.getInput('region')
    response = await sshService.execCommand(
      `eval $(aws ecr get-login --no-include-email --region ${region})`
    )
    // @TODO check for error
    core.info(JSON.stringify(response))

    response = await sshService.execCommand(
      `docker image pull ${image}:${sha8}`
    )
    // @TODO check for error
    core.info(JSON.stringify(response))

    core.info(`Deploy stack`)
    const repo = convertReponameToDnsValid(
      // @ts-ignore
      `${process.env.GITHUB_REPOSITORY}`.split('/').pop()
    )

    response = await sshService.execCommand(
      `docker stack deploy --compose-file /home/gha/docker-compose.${sha8}.yml ${repo}`
    )
    // @TODO check for error
    core.info(JSON.stringify(response))

    await sshService.dispose()
    core.setOutput('time', new Date().toTimeString())

    return
  } catch (error) {
    core.setFailed(error.message)
  }
}
function convertReponameToDnsValid(reponame: string) {
  return reponame.replace('.', '-')
}
run()
