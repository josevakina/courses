'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface ShoppingItem {
  id: string
  product: string
  quantity: number
  currentPrice?: number
  previousPrice?: number
  purchased: boolean
  purchaseDate: string
  createdAt: string
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState({
    product: '',
    quantity: 1,
    currentPrice: '',
    previousPrice: ''
  })
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    fetchItems()
  }, [status, router])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/shopping-items')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.product.trim()) return

    try {
      const response = await fetch('/api/shopping-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      })

      if (response.ok) {
        const item = await response.json()
        setItems([item, ...items])
        setNewItem({ product: '', quantity: 1, currentPrice: '', previousPrice: '' })
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error)
    }
  }

  const updateItem = async (id: string, updates: Partial<ShoppingItem>) => {
    try {
      const response = await fetch(`/api/shopping-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setItems(items.map(item => item.id === id ? updatedItem : item))
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return

    try {
      const response = await fetch(`/api/shopping-items/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setItems(items.filter(item => item.id !== id))
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const togglePurchased = async (id: string, purchased: boolean) => {
    await updateItem(id, { purchased })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const pendingItems = items.filter(item => !item.purchased)
  const purchasedItems = items.filter(item => item.purchased)

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ma Liste de Courses</h1>
              <p className="text-sm text-gray-600">Bonjour {session?.user?.name}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Bouton d'ajout */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Ajouter un article</span>
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Nom du produit"
                  value={newItem.product}
                  onChange={(e) => setNewItem({...newItem, product: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white/50"
                  required
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Quantité"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white/50"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Prix (€)"
                  value={newItem.currentPrice}
                  onChange={(e) => setNewItem({...newItem, currentPrice: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white/50"
                />
              </div>
              <div className="md:col-span-4 flex space-x-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ancien prix (€)"
                  value={newItem.previousPrice}
                  onChange={(e) => setNewItem({...newItem, previousPrice: e.target.value})}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white/50"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 transition-all duration-200"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des articles à acheter */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>À acheter ({pendingItems.length})</span>
          </h2>
          
          {pendingItems.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500">Aucun article dans votre liste</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {pendingItems.map((item) => (
                <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <button
                        onClick={() => togglePurchased(item.id, true)}
                        className="w-5 h-5 border-2 border-gray-300 rounded hover:border-emerald-500 transition-colors duration-200"
                      ></button>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>Qté: {item.quantity}</span>
                          {item.currentPrice && (
                            <span className="text-emerald-600 font-medium">{item.currentPrice}€</span>
                          )}
                          {item.previousPrice && (
                            <span className="text-red-500 line-through">{item.previousPrice}€</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Formulaire d'édition */}
                  {editingItem === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        updateItem(item.id, {
                          product: formData.get('product') as string,
                          quantity: parseInt(formData.get('quantity') as string),
                          currentPrice: formData.get('currentPrice') ? parseFloat(formData.get('currentPrice') as string) : undefined,
                          previousPrice: formData.get('previousPrice') ? parseFloat(formData.get('previousPrice') as string) : undefined
                        })
                      }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input
                          name="product"
                          defaultValue={item.product}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white/50"
                          placeholder="Produit"
                        />
                        <input
                          name="quantity"
                          type="number"
                          defaultValue={item.quantity}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white/50"
                          placeholder="Quantité"
                        />
                        <input
                          name="currentPrice"
                          type="number"
                          step="0.01"
                          defaultValue={item.currentPrice || ''}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white/50"
                          placeholder="Prix actuel"
                        />
                        <input
                          name="previousPrice"
                          type="number"
                          step="0.01"
                          defaultValue={item.previousPrice || ''}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white/50"
                          placeholder="Ancien prix"
                        />
                        <div className="col-span-2 md:col-span-4 flex space-x-2">
                          <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors duration-200"
                          >
                            Sauvegarder
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors duration-200"
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Liste des articles achetés */}
        {purchasedItems.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Achetés ({purchasedItems.length})</span>
            </h2>
            
            <div className="grid gap-3">
              {purchasedItems.map((item) => (
                <div key={item.id} className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <button
                        onClick={() => togglePurchased(item.id, false)}
                        className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-white hover:bg-emerald-600 transition-colors duration-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-700 line-through">{item.product}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>Qté: {item.quantity}</span>
                          {item.currentPrice && (
                            <span className="text-emerald-600 font-medium">{item.currentPrice}€</span>
                          )}
                          <span>Acheté le {new Date(item.purchaseDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}