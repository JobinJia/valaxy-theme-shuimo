/**
 * UI 交互工具类，封装滚动、样式切换等逻辑
 */
export class UiTools {
  private lastScrollX = 0
  private pFrame = 0

  xcroll(v: number, deps: { needupdate: () => boolean, update: () => void, viewupdate: () => void, MEM: { cursx: number } }): void {
    deps.MEM.cursx += v
    if (deps.needupdate())
      deps.update()
    else deps.viewupdate()
  }

  autoxcroll(v: number, deps: { needupdate: () => boolean, update: () => void, viewupdate: () => void, MEM: { cursx: number } }): void {
    if ((document.getElementById('AUTO_SCROLL') as HTMLInputElement | null)?.checked) {
      this.xcroll(v, deps)
      setTimeout(() => this.autoxcroll(v, deps), 2000)
    }
  }

  rstyle(id: string, windy: number, dim = false): void {
    const a = dim ? 0.1 : 0.0
    const el = document.getElementById(id)
    const tel = document.getElementById(`${id}.t`)
    if (!el || !tel)
      return
    el.setAttribute(
      'style',
      `width:32px;text-align:center;top:0px;color:rgba(0,0,0,0.4);display:table;cursor:pointer;border:1px solid rgba(0,0,0,0.4);background-color:rgba(0,0,0,${a});height:${windy}px`,
    )
    tel.setAttribute('style', 'vertical-align:middle; display:table-cell')
  }

  toggleVisible(id: string): void {
    const el = document.getElementById(id)
    if (!el)
      return
    const isHidden = el.style.display === 'none'
    el.style.display = isHidden ? 'block' : 'none'
  }

  toggleText(id: string, a: string, b: string): void {
    const el = document.getElementById(id)
    if (!el)
      return
    const v = el.innerHTML
    el.innerHTML = v === '' || v === b ? a : b
  }

  present(): void {
    const currScrollX = window.scrollX
    const step = 1
    document.body.scrollTo(Math.max(0, this.pFrame - 10), window.scrollY)

    this.pFrame += step

    if (this.pFrame < 20 || Math.abs(this.lastScrollX - currScrollX) < step * 2) {
      this.lastScrollX = currScrollX
      setTimeout(() => this.present(), 1)
    }
  }

  reloadWithSeed(s: string): void {
    const u = window.location.href.split('?')[0]
    window.location.href = `${u}?seed=${s}`
  }
}

/**
 * 便捷实例
 */
export const uiTools = new UiTools()
