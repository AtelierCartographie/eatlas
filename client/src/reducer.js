const initialState = {
  users: {
    loading: true,
    list: [],
  },
}

export default (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_USERS':
    case 'FETCH_USER':
      return { ...state, users: { loading: true, list: [] } }

    case 'RECEIVE_USERS':
      return { ...state, users: { loading: false, list: action.payload.users } }

    case 'RECEIVE_USER':
      return {
        ...state,
        users: {
          loading: false,
          list: state.users.list
            .filter(u => u.id !== action.payload.user.id)
            .concat(action.payload.user),
        },
      }

    default:
      return state
  }
}
