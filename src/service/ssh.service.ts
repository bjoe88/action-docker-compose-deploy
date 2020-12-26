import {NodeSSH, SSHExecCommandOptions} from 'node-ssh'
import * as core from '@actions/core'

export class SshService {
  private ssh: NodeSSH

  public constructor() {
    this.ssh = new NodeSSH()
  }

  public async connect() {
    const host = core.getInput('host')
    const username = core.getInput('username')
    const privateKey = core.getInput('privateKey')
    return this.ssh.connect({
      host,
      username,
      privateKey
    })
  }

  public async putFile(localFile: string, remoteFile: string) {
    return this.ssh.putFile(  localFile, remoteFile
    )
  }

  public async getFile(localFile: string, remoteFile: string) {
    return this.ssh.getFile(
      localFile,
      remoteFile
    )
  }

  public async execCommand(command: string, options?: SSHExecCommandOptions) {
    return this.ssh.execCommand(command, options)
  }
}
