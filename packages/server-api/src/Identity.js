class Identity {
  constructor(account, dbs) {
    this.account = account
    this.dbs = dbs
  }

  get is() {
    return {
      account: ({ account }) => this.account === account,
      owner:  ({ db }) => this.dbs.some(e => e.name === db && ['owner'].includes(e.role)),
      admin:  ({ db }) => this.dbs.some(e => e.name === db && ['owner', 'admin'].includes(e.role)),
      member: ({ db }) => this.dbs.some(e => e.name === db && ['owner', 'admin', 'member'].includes(e.role)),
      reader: ({ db }) => this.dbs.some(e => e.name === db && ['owner', 'admin', 'member', 'reader'].includes(e.role))
    }
  }
}

module.exports = Identity
