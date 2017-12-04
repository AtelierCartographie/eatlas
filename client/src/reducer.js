const initialState = {
  users: {
    loading: false,
    list: [
      {
        id: 1,
        name: 'John',
        email: 'john@example.com',
      },
      {
        id: 2,
        name: 'Jack',
        email: 'jack@example.com',
      },
    ],
  },
}

export default (state = initialState, action) => {
  switch (action.type) {
    default:
      return state
  }
}
