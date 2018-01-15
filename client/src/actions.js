import {
  // users
  getUser,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  //getResource,
  getResources,
} from './api'

export const fetchUser = id => dispatch => {
  dispatch({ type: 'FETCH_USER', payload: { id } })

  getUser(id).then(user =>
    dispatch({
      type: 'RECEIVE_USER',
      payload: { user },
    }),
  )
}

export const fetchUsers = () => dispatch => {
  dispatch({ type: 'FETCH_USERS' })

  return getUsers().then(users =>
    dispatch({
      type: 'RECEIVE_USERS',
      payload: { users },
    }),
  )
}

export const saveUser = ({ id, ...data }) => dispatch => {
  dispatch({ type: 'SAVE_USER' })

  const save = () => (id ? updateUser(id, data) : addUser(data))
  return save().then(user =>
    dispatch({
      type: 'RECEIVE_USER',
      payload: { user },
    }),
  )
}

export const _deleteUser = id => dispatch => {
  dispatch({ type: 'DELETE_USER' })
  deleteUser().then(() => {
    dispatch({
      // TODO: consistent naming of all actions trio
      type: 'DELETE_USER_SUCCESS',
      payload: { id },
    })
  })
}

export const fetchResources = () => dispatch => {
  dispatch({ type: 'FETCH_RESOURCES' })

  getResources().then(resources =>
    dispatch({
      type: 'RECEIVE_RESOURCES',
      payload: { resources },
    }),
  )
}

export const userLogin = ({ id, name, email, role = 'visitor' }) => ({
  type: 'LOGIN',
  payload: { id, name, email, role },
})

export const userLogout = () => ({
  type: 'LOGOUT',
})

export const notifyCheckedUserSession = (isChecked = true) => ({
  type: 'CHECKED_USER_SESSION',
  payload: isChecked,
})

export const notifyVerifyingUser = (isVerifying = true) => ({
  type: 'VERIFYING_USER',
  payload: isVerifying,
})
