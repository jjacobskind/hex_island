export default class BoardClass {
  constructor() {
    this.data = [
      { type: 'desert', count: 1, image: 'components/board/render-engine/desert.png' },
      { type: 'forest', count: 4, image: 'components/board/render-engine/forest.png' },
      { type: 'ore', count: 3, image: 'components/board/render-engine/ore.png' },
      { type: 'sheep', count: 4, image: 'components/board/render-engine/sheep.png' },
      { type: 'wheat', count: 4, image: 'components/board/render-engine/wheat.png' },
      { type: 'wood', count: 3, image: 'components/board/render-engine/wood.png' }
    ]
    this.tiles = []
  }

  generate(num = 19) {
    let tiles = []
    this.data.forEach(d => {
      for (let i = 0; i < d.count; i++) {
        tiles.push({ type: d.type, image: d.image })
      }
    })
    tiles = this.shuffle(tiles)
    this.tiles = tiles.slice(0, num)
  }

  shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1

      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }

    return array
  }
}