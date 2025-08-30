import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { product, quantity, currentPrice, previousPrice, purchased } = await request.json()

    // Vérifier que l'article appartient à l'utilisateur
    const existingItem = await prisma.shoppingItem.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    const updatedItem = await prisma.shoppingItem.update({
      where: { id: params.id },
      data: {
        product,
        quantity: quantity ? parseInt(quantity) : existingItem.quantity,
        currentPrice: currentPrice !== undefined ? (currentPrice ? parseFloat(currentPrice) : null) : existingItem.currentPrice,
        previousPrice: previousPrice !== undefined ? (previousPrice ? parseFloat(previousPrice) : null) : existingItem.previousPrice,
        purchased: purchased !== undefined ? purchased : existingItem.purchased,
        purchaseDate: purchased === true ? new Date() : existingItem.purchaseDate
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'article appartient à l'utilisateur
    const existingItem = await prisma.shoppingItem.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    await prisma.shoppingItem.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Article supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}