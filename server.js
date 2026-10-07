require('dotenv').config();
const express = require('express');
var cors = require('cors');
const mysql = require('mysql');
var sha1 = require('sha1');


const app = express();
const port = process.env.APP_PORT;
const pwdRegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

var pool = mysql.createPool({
   connectionLimit:         process.env.DB_CONN_LIMIT,
    multipleStatements:     process.env.DB_MULTI_QUERY,
    host:                   process.env.DB_HOST,
    user:                   process.env.DB_USER,
    password:               process.env.DB_PASS,
    port:                   process.env.DB_PORT,
    database:               process.env.DB_NAME,
    timezone:               process.env.DB_TIMEZONE
});

app.use(cors()); 
app.use(express.urlencoded({extended: true}))
app.use(express.json());
app.get('/', (_req,res)=>{
    res.send(`Welcome to weather app API!`)
})
//regisztracio
app.post('/users/register', (req, res)=> {
    const {name, email, passwd, confirm} = req.body;
    
    if (!name || !email || !passwd || !confirm){
        return res.status(400).json({error:'Missing required fields'})
    }

    if(passwd !== confirm){
        return res.status(400).json({error:'Passwords do not match'})
    }

    if (!passwd.match(pwdRegExp)){
        return res.status(400).json({error:'Password is too weak!'})
    }


    pool.query('SELECT * FROM users WHERE email = ?', [email], (error, results)=>{
        if (error){
            return res.status(500).json({error: 'Database query error'})
        }
        if (results.length > 0){
            return res.status(400).json({error: 'This email already exists'})
        }
        //insert new user into database
        pool.query('INSERT INTO users (name, email, passwd, role) VALUES (?, ?, SHA1(?), "user")', [name, email, passwd], (error, results)=>{
            if (error){
                return res.status(500).json({error:'database injection error'})
            }
            res.status(201).json({message: 'user registered succesfully'})
        })
    })
    

})
//login
app.post('/users/login', (req, res)=>{
    const {email, passwd} = req.body;
  

    if (!email || !passwd){
        return res.status(400).json({error: 'Missing fields'});
    }

    pool.query('SELECT * FROM users WHERE email=? AND passwd=SHA1(?)',[email, passwd],(error, results)=>{
        if (error){
            return res.status(500).json({error: 'Database query error'});
        }

        if (results.length == 0){
            return res.status(400).json({error:'Invalid credentials!'});
        }    

        if(results[0].is_active==0){
            return res.status(400).json({error: 'This account is banned by an admin!'})
        }
       
        const loggedUser= {
            ID: results[0].ID,
            name: results[0].name,
            email: results[0].email,
            role: results[0].role
        };

        pool.query('UPDATE users SET last_login=CURRENT_TIMESTAMP, login_count=login_count+1 WHERE ID=?', [results[0].ID], (error, resutls)=>{
            if (error){
                return res.status(500).json({error: 'Database query error'});
            
        }

        res.status(200).json({message: 'You logged in succesfully!',loggedUser});
        })
        
        
    });
});

//jelszo valtas
app.post('/users/:uid/passmod', (req, res)=>{
    const {oldpass, newpass, confirm} = req.body; 
    const uid = req.params.uid; 

    if (!oldpass || !newpass || !confirm){
        return res.status(400).json({error: 'Missing required fields!'});
    }

  
    if (newpass != confirm){
        return res.status(400).json({error:'The new password and it\'s confirm does not match!'});
    }

    if (oldpass == newpass){
        return res.status(400).json({error: 'The new password is the same as the old password!'})
    }


    pool.query('SELECT passwd FROM users WHERE ID=?', [uid], (error,results)=>{
        if (error){
            return res.status(500).json({error: 'Database query error'});
        }

        if (results.length == 0){
            return res.status(400).json({error: 'User with this ID doesn\'t exist!'});
        }
        const oldpassHash = sha1(oldpass);

        if (results[0].passwd != oldpassHash){
            return res.status(400).json({error: 'The old password is not correct!'});
        }


        pool.query('UPDATE users SET passwd=SHA1(?) WHERE ID=?', [newpass, uid], (error, results)=>{
            if (error){
                return res.status(500).json({error: 'Database query error'});
            }
            if (!newpass.match(pwdRegExp)){
                return res.status(400).json({error:'Password is too weak!'})
            }

            return res.status(200).json({message: 'The password has been modified succesfully!'});
        });
    });
});


app.get('/users/:uid', (req, res)=>{
    const uid = req.params.uid;

    if (!uid){
        return res.status(400).json({error: 'Missing user ID!'});
    }

    pool.query('SELECT * FROM users WHERE ID=?', [uid], (error, results)=>{
        if (error){
            return res.status(500).json({error: 'Database query error'});
        }

        if (results.length == 0){
            return res.status(400).json({error: 'User with this ID doesn\'t exist!'});
        }

        let user = {
            ID: results[0].ID,
            name: results[0].name,
            email: results[0].email,
            role: results[0].role,
            created_at: results[0].created_at,
        }

        return res.status(200).json({results: user});
    })
});

app.patch('/users/:uid', (req, res)=>{
    const uid = req.params.uid;
    const {username,email, luid } = req.body;

    if (!uid || !username || !email || !luid){
        return res.status(400).json({error: 'Missing required fields!'});
    }

    if (uid != luid){
        return res.status(400).json({error: 'You are not authorized to update this profile!'});
    }

    pool.query('SELECT * FROM users WHERE ID=?', [uid], (error, results)=>{
        if (error){
            return res.status(500).json({error: 'Database query error'});
        }

        if (results.length == 0){
            return res.status(400).json({error: 'User with this ID doesn\'t exist!'});
        }

        if (username == results[0].name || email == results[0].email){
            return res.status(400).json({error: 'No changes detected!'});
        }

        pool.query('SELECT * FROM users WHERE email=? AND ID!=?', [email, uid], (error, results2)=>{
            if (error){
                return res.status(500).json({error: 'Database query error'});
            }

            if (results2.length > 0){
                return res.status(400).json({error: 'This email is already in use!'});
            }

            pool.query('UPDATE users SET name =?, email=? WHERE ID =?', [username, email, uid], (error, results3)=>{
                if (error){
                    return res.status(500).json({error: 'Database query error'});
                }
                return res.status(200).json({message: 'Profile updated succesfully!'});
            })
        })
    });

});