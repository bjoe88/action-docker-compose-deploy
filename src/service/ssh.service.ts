import {NodeSSH, SSHExecCommandOptions, SSHExecCommandResponse} from 'node-ssh'
import * as core from '@actions/core'

export class SshService {
  private ssh: NodeSSH

  constructor() {
    this.ssh = new NodeSSH()
  }

  async connect(): Promise<NodeSSH> {
    const host = core.getInput('host')
    const username = core.getInput('username')
    const privateKey = core.getInput('privateKey')
    return this.ssh.connect({
      host,
      username,
      privateKey
    })
  }

  async putFile(localFile: string, remoteFile: string): Promise<void> {
    return this.ssh.putFile(localFile, remoteFile)
  }

  async getFile(localFile: string, remoteFile: string): Promise<void> {
    return this.ssh.getFile(localFile, remoteFile)
  }

  async execCommand(
    command: string,
    options?: SSHExecCommandOptions
  ): Promise<SSHExecCommandResponse> {
    return this.ssh.execCommand(command, options)
  }

  async dispose(): Promise<void> {
    return this.ssh.dispose()
  }
}
