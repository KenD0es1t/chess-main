from .helpers import strC, kingName,oppositeColor,sameColor
from .getLegalMoves import getLegalMoves
def isKingOnCheck(board,color):
    opponentPieces = []
    kingMoves = []
    attackPieces = []
    isChecked = False
    for row in range(8):
        for col in range(8):
            if oppositeColor(color, board[row][col]):
                opponentPieces.append((board[row][col],strC(row,col)))

            if board[row][col] == kingName(color):
                kingCords = strC(row, col)
                kingMoves = getLegalMoves(kingCords, board)
                board[row][col]= ''
                

    for piece in opponentPieces:
        moves = getLegalMoves(piece[1], board, lookingForCheck=True)
        if not moves:
            continue
        for move in moves:
            if move == kingCords:
                isChecked = True
                if piece not in attackPieces:
                    attackPieces.append(piece)
                break
        if kingMoves:
            for kingMove in kingMoves.copy():
                if kingMove in moves:
                    kingMoves.remove(kingMove)


    # Setting the King on the board again
    board[int(kingCords[0])][int(kingCords[1])] = kingName(color)
    return isChecked, kingMoves, kingCords, attackPieces

def getOutOfCheck(piece,attackerPieces,board,kingCords):
    x = int(piece[1])
    y = int(piece[0])

    availableMoves = []
    if len(attackerPieces)<=1:
        # capturing the attacking piece
        pieceMoves = getLegalMoves(strC(y,x), board)
        for move in pieceMoves:
            if move == attackerPieces[0][1]:
                availableMoves.append(move)

        # blocking the attacker
        # i need to check for what type of piece the attacker is for example if the attacker is a knight i cannot block
        attackerCords = attackerPieces[0][1]
        attackerY = int(attackerCords[0])
        attackerX = int(attackerCords[1])

        kingY = int(kingCords[0])
        kingX = int(kingCords[1])
        
        # in the middle moves
        # Y axis
        if attackerY == kingY:
            for col in range(min(attackerX, kingX), max(attackerX,kingX)):
                if not board[kingY][col] or board[kingY][col] == piece[0]:
                    if strC(kingY, col) in getLegalMoves(strC(y,x), board):
                        availableMoves.append(strC(kingY, col))
        # X axis
        if attackerX == kingX:
            for row in range(min(attackerY, kingY), max(attackerY,kingY)):
                if not board[row][kingX] or board[row][kingX] == piece[0]:
                    if strC(row, kingX) in getLegalMoves(strC(y,x), board):
                        availableMoves.append(strC(row, kingX))

        # diagonal
        # top right
        if attackerY < kingY and attackerX > kingX:
            dY = kingY - 1
            dX = kingX + 1
            while dY > attackerY and dX < attackerX:
                if strC(dY,dX) in getLegalMoves(strC(y,x), board):
                    availableMoves.append(strC(dY,dX))
                dY -= 1
                dX += 1
        # top left
        if attackerY < kingY and attackerX < kingX:
            dY = kingY - 1
            dX = kingX - 1
            while dY > attackerY and dX > attackerX:
                if strC(dY,dX) in getLegalMoves(strC(y,x), board):
                    availableMoves.append(strC(dY,dX))
                dY -= 1
                dX -= 1
        # bottom right
        if attackerY > kingY and attackerX > kingX:
            dY = kingY + 1
            dX = kingX + 1
            while dY < attackerY and dX < attackerX:
                if strC(dY,dX) in getLegalMoves(strC(y,x), board):
                    availableMoves.append(strC(dY,dX))
                dY += 1
                dX += 1
        # bottom left
        if attackerY > kingY and attackerX < kingX:
            dY = kingY + 1
            dX = kingX - 1
            while dY < attackerY and dX > attackerX:
                if strC(dY,dX) in getLegalMoves(strC(y,x), board):
                    availableMoves.append(strC(dY,dX))
                dY += 1
                dX -= 1
    if availableMoves == []:
        availableMoves = None
    return availableMoves


def isPinned(pieceCoordinates, color, board):
    availableMoves = []
    x = int(pieceCoordinates[1])
    y = int(pieceCoordinates[0])
    piece = (board[y][x], pieceCoordinates)
    board[y][x] = ''
    kingCords = None
    for row in range(8):
        for col in range(8):
            if board[row][col] == kingName(color):
                kingCords = strC(row, col)
                break
        if kingCords:
            break

    # check from all directions if there is an attacking piece on a straight line
    directions = [(0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (1, -1), (-1, 1), (-1, -1)]

    for direction in directions:
        row, col = int(kingCords[0]) + direction[0], int(kingCords[1]) + direction[1]
        while 0 <= row < 8 and 0 <= col < 8:
            if board[row][col]:
                if oppositeColor(color, board[row][col]):
                    # attacking piece
                    attacker = board[row][col].lower()
                    if direction in [(0, 1), (0, -1), (1, 0), (-1, 0)] and (attacker == 'r' or attacker == 'q'):
                        # pin found
                        # moves that are on the same line as the king and the attacker
                        moves = getLegalMoves(piece[1], board, lookingForCheck=False)
                        if moves:
                            for move in moves:
                                moveY = int(move[0])
                                moveX = int(move[1])
                                if moveY == int(kingCords[0]) and moveY == row:
                                    availableMoves.append(move)
                                if moveX == int(kingCords[1]) and moveX == col:
                                    availableMoves.append(move)

                    if direction in [(1, 1), (1, -1), (-1, 1), (-1, -1)] and (attacker == 'b' or attacker == 'q'):
                        # pin found
                        moves = getLegalMoves(piece[1], board, lookingForCheck=False)
                        if moves:
                            for move in moves:
                                moveY = int(move[0])
                                moveX = int(move[1])
                                if abs(moveY - int(kingCords[0])) == abs(moveX - int(kingCords[1])) and abs(moveY - row) == abs(moveX - col):
                                    availableMoves.append(move)

                break  
            row += direction[0]
            col += direction[1]
    
    board[y][x] = piece[0]
    
    if availableMoves == []:
        return None
    return availableMoves


def isCheckmated(color,attackerPieces,board,kingCords):
    friendlyPieces = []
    for row in range(8):
        for col in range(8):
            if sameColor(color, board[row][col]):
                friendlyPieces.append((board[row][col],strC(row,col)))

    for piece in friendlyPieces:
        moves = getLegalMoves(piece[1], board)
        for move in moves:
            oldPiece = board[int(move[0])][int(move[1])]
            board[int(move[0])][int(move[1])] = piece[0]
            board[int(piece[1][0])][int(piece[1][1])] = ''
            if not isKingOnCheck(board, color)[0]:
                board[int(piece[1][0])][int(piece[1][1])] = piece[0]
                board[int(move[0])][int(move[1])] = oldPiece
                return False

            board[int(piece[1][0])][int(piece[1][1])] = piece[0]
            board[int(move[0])][int(move[1])] = oldPiece

    return True

def isStaleMate(color, board):
    staleMate = True
    friendlyPieces = []
    for row in range(8):
        for col in range(8):
            if sameColor(color, board[row][col]):
                friendlyPieces.append((board[row][col],strC(row,col)))

    for piece in friendlyPieces:
        moves = getLegalMoves(piece[1], board)
        if moves !=[]:
            staleMate = False
            break
    return staleMate

def isDraw(board,color):
    friendlyPieces = []
    opponentPieces = []
    for row in range(8):
        for col in range(8):
            if sameColor(color, board[row][col]):
                friendlyPieces.append((board[row][col],strC(row,col)))
            if oppositeColor(color, board[row][col]):
                opponentPieces.append((board[row][col],strC(row,col)))


    if len(friendlyPieces) == 1 and len(opponentPieces)== 1:
        return True
    friendlyStatus = False
    if len(friendlyPieces) == 2  :
        if len(opponentPieces) ==2:
            for piece in friendlyPieces:
                if 'n' == piece[0].lower or 'b' == piece[0].lower():
                    friendlyStatus = True
            if friendlyStatus:
                for piece in opponentPieces:
                    if 'n' == piece[0].lower or 'b' == piece[0].lower():
                        return True
        if len(opponentPieces) == 1:
            for piece in friendlyPieces:
                if 'n' == piece[0].lower or 'b' == piece[0].lower():
                    return True  
    if len(friendlyPieces) == 1 and len(opponentPieces) == 2:
        for piece in opponentPieces:
            if 'n' == piece[0].lower or 'b' == piece[0].lower():
                return True
    if len(friendlyPieces) == 1 and len(opponentPieces) == 1:
        return True
    return False