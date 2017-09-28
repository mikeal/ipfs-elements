const ZComponent = require('zcomponent')
const api = require('ipfs-api')
const render = require('render-media')
const through2 = require('through2')
// const IPFS = require('ipfs')


class IPFSElement extends ZComponent {
  set src (value) {
    this.render(value)
  }
  set api (value) {
    if (this._ipfs) throw new Error('IPFS already set.')
    this._ipfs = api(value)
  }
  get ipfs () {
    return new Promise(resolve => {
      if (!this._ipfs) {
        this._ipfs = this._getIPFS()
        this._ipfs.on('ready', () => resolve(this._ipfs))
        return
      }
      resolve(this._ipfs)
    })
  }
  _getIPFS () {
    throw new Error('Not implemented.')
    // return new IPFS()
  }
  append (file) {
    render.append(file, this)
  }
}

class IPFSDirectory extends IPFSElement {
  async render (src) {
    let ipfs = await this.ipfs
    let list = await ipfs.ls(src)
    list.Objects[0].Links.filter(f => f.Type === 2)
    .forEach(file => {
      let name = src + '/' + file.Name
      let createReadStream = opts => {
        if (!opts) opts = {}
        let offset = opts.start
        let count = opts.end - opts.start
        let stream = through2()
        ipfs.files.cat(name).then(_stream => {
          _stream.pipe(stream)
        })
        return stream
      }
      this.append({name, createReadStream})
    })
  }
}

class IPFSFile extends IPFSElement {
  async render (src) {
    let ipfs = await this.ipfs
    let name = this.getAttribute('name')
    if (!name) throw new Error('Missing required name attribute.')
    let createReadStream = opts => {
      if (!opts) opts = {}
      let offset = opts.start
      let count = opts.end - opts.start
      // TODO: handle offsets
      let stream = through2()
      console.log(src)
      ipfs.files.cat(src).then(_stream => {
        _stream.pipe(stream)
      })
      return stream
    }
    this.append({name, createReadStream})
  }
}

class IPFSImage extends IPFSFile {
  render (src) {
    this.setAttribute('name', 'file.png')
    return super.render(src)
  }
}
class IPFSText extends IPFSFile {
  render (src) {
    this.setAttribute('name', 'file.txt')
    return super.render(src)
  }
}

window.customElements.define('ipfs-dir', IPFSDirectory)
window.customElements.define('ipfs-file', IPFSFile)
window.customElements.define('ipfs-img', IPFSImage)
window.customElements.define('ipfs-txt', IPFSText)

exports.IPFSDirectory = IPFSDirectory
exports.IPFSFile = IPFSFile
exports.IPFSImage = IPFSImage
exports.IPFSText = IPFSText
