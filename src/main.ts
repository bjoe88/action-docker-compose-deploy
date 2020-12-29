import * as core from '@actions/core'
import {SshService} from './service/ssh.service'
import * as fs from 'fs'

async function run(): Promise<void> {
  // noinspection TypeScriptValidateTypes
  try {
    const sshService = new SshService()
    const sha8 = core.getInput('sha8')
    const image = core.getInput('image')
    const env = core.getInput('env')
    const dockerCompose = core.getInput('dockerCompose')

    let dockerComposeFile = fs.readFileSync(
      `${process.env.GITHUB_WORKSPACE}/${dockerCompose}`,
      `utf8`
    )

    dockerComposeFile = dockerComposeFile.replace(/:DOCKER_TAG/g, sha8)
    dockerComposeFile = dockerComposeFile.replace(/:ENV/g, env)

    core.info(`Writing docker-compose.yml.`)
    fs.writeFileSync(
      `${process.env.GITHUB_WORKSPACE}/docker-compose.${sha8}-${env}.yml`,
      dockerComposeFile,
      'utf8'
    )
    await sshService.connect()
    core.info(`Copy file to remote server`)
    await sshService.putFile(
      `${process.env.GITHUB_WORKSPACE}/docker-compose.${sha8}-${env}.yml`,
      `/home/gha/docker-compose.${sha8}-${env}.yml`
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
    // @ts-ignore
    const repo = convertReponameToDnsValid(
      `${process.env.GITHUB_REPOSITORY}`.split('/').pop()
    )

    response = await sshService.execCommand(
      `docker stack deploy --compose-file /home/gha/docker-compose.${sha8}-${env}.yml ${repo}-${env}`
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
  return reponame.replace(/./g, '-')
}
run()
