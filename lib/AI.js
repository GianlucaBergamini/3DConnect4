import "./GameLogic.js"

class Player {

    bestMove(node) {
        let result = this.minimax(node, 10, true)
        if (result === 0 || result === -1)
            return node.getAvailableMoves()[0]

        let startNode = node
        node = result[1]
        while (node.father !== startNode) {
            node = node.father
        }
        return node.lastValue

    }

    minimax(node, depth, maximisingPlayer) {
        let value;
        if (depth === 0 || node.checkTie() || node.checkWin()) {
            if (node.checkTie())
                return 0
            if (maximisingPlayer)
                return [1, node]
            if (!maximisingPlayer)
                return [-1, node]
        }

        if (maximisingPlayer) {
            value = -100000
            for (let i in node.getAvailableMoves()) {
                let child = node.getGame()
                child.addCoin(i)
                child.lastValue = i
                child.father = node
                value = Math.max(value, this.minimax(child, depth - 1, false)[0])
            }
            return value
        }

        if (!maximisingPlayer) {
            value = 100000
            for (let i in node.getAvailableMoves()) {
                let child = node.getGame()
                child.addCoin(i)
                value = Math.min(value, this.minimax(child, depth - 1, true)[0])
            }
            return value
        }
    }
}