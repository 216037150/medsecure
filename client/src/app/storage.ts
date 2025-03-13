import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root',
})
export class Storage {
    setItem = <T>(key: string, value: T): void => {
        try {
            const serializedValue = JSON.stringify(value)
            localStorage.setItem(key, serializedValue)
        } catch (error) {
            throw new Error('')
        }
    }

    getItem = <T>(key: string): T | null => {
        try {
            const serializedValue = localStorage.getItem(key)
            if (serializedValue) {
                return JSON.parse(serializedValue) as T
            }
            return null
        } catch (error) {
            console.log('Error getting item from localStorage')
            return null
        }
    }

    updateItem = <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            throw new Error('')
        }
    }

    removeItem = (key: string): void => {
        try {
            localStorage.removeItem(key)
        } catch (error) {
            throw new Error('')
        }
    }

    // Clear all items from localStorage
    clearAll = (): void => {
        try {
            localStorage.clear()
        } catch (error) {
            console.error('Error clearing localStorage:', error)
        }
    }
}
