from database.database import db
from router import Router

router = Router()


#Define the route handlers here!!!!
def login(handler):
    pass

def logout(handler):
    pass


def register(handler):
    pass



#Match the route handlers to a path here!!!
router.post('/api/login', login)
router.post('/api/logout', logout)
router.post('/api/register', register)