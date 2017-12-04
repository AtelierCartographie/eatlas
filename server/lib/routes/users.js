exports.get = (req, res) => {
  // TODO
  req.json({
    users: [
      {
        id: 1,
        name: 'user_1',
        email: 'user_1@example.com',
        role: 'admin',
      },
      {
        id: 2,
        name: 'user_2',
        email: 'user_2@example.com',
        role: 'admin',
      },
    ],
  })
}
