import React from 'react'

const CommingSoon = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80vh',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa'
    }}>
      <h1 style={{
        fontSize: '3.5rem',
        color: '#343a40',
        marginBottom: '1rem'
      }}>
        🚀 Coming Soon!
      </h1>
      <p style={{
        fontSize: '1.25rem',
        color: '#6c757d'
      }}>
        We're working hard to bring you an amazing new experience. Stay tuned!
      </p>
    </div>
  )
}

export default CommingSoon
