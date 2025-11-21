/**
 * 下载工具，封装文本下载为本地文件的逻辑
 */
export class Downloader {
  download(filename: string, text: string): void {
    const element = document.createElement('a')
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }
}

/**
 * 便捷实例
 */
export const downloader = new Downloader()
