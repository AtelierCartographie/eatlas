import { getUser, getUsers } from './api'

export const fetchUser = id => dispatch => {
  dispatch({ type: 'FETCH_USER', payload: { id } })

  getUser().then(user =>
    dispatch({
      type: 'RECEIVE_USER',
      payload: { user },
    }),
  )
}

export const fetchUsers = () => dispatch => {
  dispatch({ type: 'FETCH_USERS' })

  getUsers().then(users =>
    dispatch({
      type: 'RECEIVE_USERS',
      payload: { users },
    }),
  )
}

export const userLogin = ({ name, email, role = 'visitor' }) => ({
  type: 'LOGIN',
  payload: { name, email, role },
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
