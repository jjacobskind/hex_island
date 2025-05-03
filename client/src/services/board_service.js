import BoardClass from './board_class'

export function generateBoard(num = 19) {
  const board = new BoardClass()
  board.generate(num)
  return board.tiles
}