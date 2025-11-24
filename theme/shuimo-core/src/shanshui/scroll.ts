/**
 * 卷轴生成模块
 * Scroll generation module using noise-based texture algorithms
 */
export const Scroll = {
  /**
   * 获取 SVG 滤镜定义
   * Get SVG filter definitions for wood and rope textures
   */
  getFilters(): string {
    return `
      <defs>
        <!-- Wood Grain Filter -->
        <filter id="woodFilter" x="0%" y="0%" width="100%" height="100%">
          <!-- Base turbulence for grain -->
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.005" numOctaves="5" result="noise" />
          
          <!-- Color matrix to create wood tones -->
          <feColorMatrix type="matrix" in="noise" result="woodColor"
            values="0.4 0 0 0 0.3
                    0 0.3 0 0 0.2
                    0 0 0.2 0 0.1
                    0 0 0 1 0" />
          
          <!-- Lighting for cylindrical 3D effect -->
          <feDiffuseLighting in="noise" lighting-color="#fff" surfaceScale="2" diffuseConstant="1" result="light">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          
          <!-- Composite color and light -->
          <feComposite in="woodColor" in2="light" operator="multiply" result="litWood" />
          
          <!-- Add cylindrical shading (darker edges) -->
          <feComponentTransfer in="litWood" result="finalWood">
             <feFuncR type="linear" slope="1.2" intercept="-0.1"/>
             <feFuncG type="linear" slope="1.2" intercept="-0.1"/>
             <feFuncB type="linear" slope="1.2" intercept="-0.1"/>
          </feComponentTransfer>
        </filter>

        <!-- Ring Gradient -->
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8d6e63" />
          <stop offset="20%" stop-color="#d7ccc8" />
          <stop offset="50%" stop-color="#8d6e63" />
          <stop offset="80%" stop-color="#d7ccc8" />
          <stop offset="100%" stop-color="#5d4037" />
        </linearGradient>

        <!-- Rope/Silk Filter -->
        <filter id="ropeFilter" x="0%" y="0%" width="100%" height="100%">
          <!-- Turbulence for fiber texture -->
          <feTurbulence type="fractalNoise" baseFrequency="0.1 0.1" numOctaves="3" result="fiberNoise" />
          
          <!-- Displacement for rough edges -->
          <feDisplacementMap in="SourceGraphic" in2="fiberNoise" scale="3" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          
          <!-- Lighting for volume -->
          <feDiffuseLighting in="displaced" lighting-color="#fff" surfaceScale="3" diffuseConstant="1.2" result="light">
            <feDistantLight azimuth="90" elevation="45" />
          </feDiffuseLighting>
          
          <!-- Composite -->
          <feComposite in="displaced" in2="light" operator="multiply" />
        </filter>
        
        <!-- Drop Shadow for depth -->
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="1" dy="2" result="offsetBlur" />
          <feComponentTransfer in="offsetBlur" result="shadowMatrix">
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="shadowMatrix" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    `
  },

  /**
   * 木质卷轴轴杆
   * Wooden scroll bar with procedural wood grain using noise and filters
   */
  bar(x: number, y: number, args: any = {}): string {
    const height = args.height ?? 800
    const width = args.width ?? 60

    let canv = ''

    // Main Body with Wood Filter
    // We use a rect filled with a base color, then apply the filter
    // The filter handles the grain and lighting
    canv += `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${width / 2}" ry="${width / 8}" 
              fill="#8B6945" filter="url(#woodFilter)" />`

    // Decorative Rings (Gold/Bronze)
    // Keep these vector-based for sharpness
    for (const heightRatio of [0.15, 0.85]) {
      const ringY = y + height * heightRatio
      const ringHeight = 6

      // Ring shadow/depth
      canv += `<rect x="${x - 2}" y="${ringY - 1}" width="${width + 4}" height="${ringHeight + 2}" rx="4" 
                fill="#3e2723" opacity="0.6" />`

      // Ring body
      canv += `<rect x="${x - 1}" y="${ringY}" width="${width + 2}" height="${ringHeight}" rx="3" 
                fill="url(#ringGradient)" stroke="#4e342e" stroke-width="1" />`
    }

    return canv
  },

  /**
   * 连接线（丝绸/绳索）
   * Connecting line with rope texture using filters
   */
  line(x: number, y: number, args: any = {}): string {
    const width = args.width ?? 1200
    const height = args.height ?? 30

    let canv = ''

    // Calculate catenary curve points
    const sag = 12
    const segments = 20
    let d = `M ${x} ${y + height / 2}`

    for (let i = 1; i <= segments; i++) {
      const t = i / segments
      const xPos = x + t * width
      const yPos = y + height / 2 + Math.sin(t * Math.PI) * sag
      d += ` L ${xPos} ${yPos}`
    }

    // Shadow path (slightly offset)
    canv += `<path d="${d}" stroke="rgba(0,0,0,0.2)" stroke-width="6" fill="none" transform="translate(0, 4)" />`

    // Main Rope Path with Filter
    canv += `<path d="${d}" stroke="#C9A875" stroke-width="5" fill="none" filter="url(#ropeFilter)" />`

    // Decorative Knots at ends
    // Left Knot
    canv += `<circle cx="${x + 10}" cy="${y + height / 2}" r="6" fill="#C9A875" filter="url(#ropeFilter)" />`

    // Right Knot
    canv += `<circle cx="${x + width - 10}" cy="${y + height / 2}" r="6" fill="#C9A875" filter="url(#ropeFilter)" />`

    return canv
  },
}
