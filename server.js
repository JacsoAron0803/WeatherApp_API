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
            return res.status(500).json({error})
        }
        if (results.length > 0){
            return res.status(400).json({error: 'This email already exists'})
        }
        //insert new user into database
        pool.query('INSERT INTO users (name, email, passwd, role, status) VALUES (?, ?, SHA1(?), "user", 1)', [name, email, passwd], (error, results)=>{
            if (error){
                return res.status(500).json({error:'Database query error'})
            }
            res.status(201).json({message: 'user registered succesfully'})
        })
    })
    

});
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

        if(results[0].status==0){
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
        if (!newpass.match(pwdRegExp)){
            return res.status(400).json({error:'Password is too weak!'})
            }

        pool.query('UPDATE users SET passwd=SHA1(?) WHERE ID=?', [newpass, uid], (error, results)=>{
            if (error){
                return res.status(500).json({error: 'Database query error'});
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

        if (username == results[0].name && email == results[0].email){
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

//idojaras listazasa

app.get('/weather/:uid', (req, res) => {
    const { uid } = req.params;

    pool.query('SELECT ID, status FROM users WHERE ID=?', [uid], (error, users) => {
        if (error) {
            return res.status(500).json({error: 'Database query error'});
        }

        if (users.length == 0) {
            return res.status(404).json({error: 'User with this ID does not exist!'});
        }

        if (users[0].status == 0 || users[0].status == 'banned') {
            return res.status(403).json({error: 'This account is banned by an admin!'});
        }

        pool.query('SELECT ID, date, location, temp_min, temp_max, weather_type, precipitation, precipitation_probability, wind_speed, wind_direction, humidity, pressure, uv_index, created_at, updated_at FROM weather_forecasts ORDER BY date, location', (error, results) => {
            if (error) {
                return res.status(500).json({error: 'Database query error'});
            }

            return res.status(200).json({results});
        });
    });
});


//egy elorejelzes listazasa
app.get('/weather/:uid/:weatherID', (req, res) => {
    const { uid, weatherID } = req.params;

    pool.query('SELECT ID, status FROM users WHERE ID=?', [uid], (error, users) => {
        if (error) {
            return res.status(500).json({error: 'Database query error'});
        }

        if (users.length == 0) {
            return res.status(404).json({error: 'User with this ID does not exist!'});
        }

        if (users[0].status == 0 || users[0].status == 'banned') {
            return res.status(403).json({error: 'This account is banned by an admin!'});
        }

        pool.query('SELECT * FROM weather_forecasts WHERE ID=?', [weatherID], (error, results) => {
            if (error) {
                return res.status(500).json({error: 'Database query error'});
            }

            if (results.length == 0) {
                return res.status(404).json({error: 'Forecast with this ID does not exist!'});
            }

            return res.status(200).json({results: results[0]});
        });
    });
});


//admin-felhasznalo listazas
app.post('/admin/users', (req, res) => {
    const { luid } = req.body;

    if (!luid) {
        return res.status(400).json({error: 'Missing admin user ID!'});
    }

    pool.query('SELECT ID, role FROM users WHERE ID=?', [luid], (error, admins) => {
        if (error) {
            return res.status(500).json({error: 'Database query error'});
        }

        if (admins.length == 0 || admins[0].role != 'admin') {
            return res.status(403).json({error: 'You are not authorized to perform this action!'});
        }

        pool.query('SELECT ID, name, email, role, status, registration_date, last_login, login_count FROM users ORDER BY ID', (error, results) => {
            if (error) {
                return res.status(500).json({error: 'Database query error'});
            }

            return res.status(200).json({results});
        });
    });
});


//admin-felh.tiltas
app.patch('/admin/status', (req, res) => {
    const { uid, luid } = req.body;

    if (!uid || !luid) {
        return res.status(400).json({error: 'Missing required fields!'});
    }

    pool.query('SELECT ID, role FROM users WHERE ID=?', [luid], (error, admins) => {
        if (error) {
            return res.status(500).json({error: 'Database query error'});
        }

        if (admins.length == 0 || admins[0].role != 'admin') {
            return res.status(403).json({error: 'You are not authorized to perform this action!'});
        }

        pool.query('SELECT ID, status FROM users WHERE ID=?', [uid], (error, users) => {
            if (error) {
                return res.status(500).json({error: 'Database query error'});
            }

            if (users.length == 0) {
                return res.status(404).json({error: 'User with this ID does not exist!'});
            }

            const newStatus = users[0].status == 1 ? 0 : 1;

            pool.query('UPDATE users SET status=? WHERE ID=?', [newStatus, uid], (error, results) => {
                if (error) {
                    return res.status(500).json({error: 'Database query error'});
                }

                return res.status(200).json({
                    message: newStatus == 1 ? 'User account activated!' : 'User account banned!',
                    status: newStatus
                });
            });
        });
    });
});


//osszes elorejelzes listazasa
app.post('/admin/weather/list', (req, res) => {
    const { luid } = req.body;

    if (!luid) {
        return res.status(400).json({error: 'Missing admin user ID!'});
    }

    pool.query('SELECT ID, role FROM users WHERE ID=?', [luid], (error, admins) => {
        if (error) {
            return res.status(500).json({error: 'Database query error'});
        }

        if (admins.length == 0 || admins[0].role != 'admin') {
            return res.status(403).json({error: 'You are not authorized to perform this action!'});
        }

        pool.query('SELECT * FROM weather_forecasts ORDER BY date, location', (error, results) => {
            if (error) {
                return res.status(500).json({error: 'Database query error'});
            }

            return res.status(200).json({results});
        });
    });
});


//uj elorejelzes
app.post('/admin/weather', (req, res) => {
    const {
        luid,
        date,
        location,
        temp_min,
        temp_max,
        weather_type,
        precipitation,
        precipitation_probability,
        wind_speed,
        wind_direction,
        humidity,
        pressure,
        uv_index
    } = req.body;

    if (!luid || !date || !location || temp_min === undefined || temp_max === undefined || !weather_type) {
        return res.status(400).json({error: 'Missing required forecast fields!'});
    }

    pool.query('SELECT ID, role FROM users WHERE ID=?', [luid], (error, admins) => {
        if (error) {
            return res.status(500).json({error: 'Database query error'});
        }

        if (admins.length == 0 || admins[0].role != 'admin') {
            return res.status(403).json({error: 'You are not authorized to perform this action!'});
        }

        pool.query('INSERT INTO weather_forecasts (date, location, temp_min, temp_max, weather_type, precipitation, precipitation_probability, wind_speed, wind_direction, humidity, pressure, uv_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [date, location, temp_min, temp_max, weather_type, precipitation ?? null, precipitation_probability ?? null, wind_speed ?? null, wind_direction ?? null, humidity ?? null, pressure ?? null, uv_index ?? null], (error, results) => {
            if (error) {
                return res.status(500).json({error: 'Database query error'});
            }

            return res.status(201).json({
                message: 'Forecast created successfully!',
                weatherID: results.insertId
            });
        });
    });
});


//elorejelzes modositasa


app.patch('/weather/:uid/:weatherID', (req, res) => {
    const uid = req.params.uid;
    const weatherID = req.params.weatherID;
    const luid = req.body.luid;

    const {
        date,
        location,
        temp_min,
        temp_max,
        weather_type,
        precipitation,
        precipitation_probability,
        wind_speed,
        wind_direction,
        humidity,
        pressure,
        uv_index
    } = req.body;

    if (!uid || !weatherID || !luid || !date || !location || temp_min === undefined || temp_max === undefined || !weather_type) {
        return res.status(400).json({error: 'Missing required fields!'});
    }

    if (uid != luid) {
        return res.status(400).json({error: 'You are not authorized to update this weather forecast!'});
    }

    pool.query('SELECT ID, role FROM users WHERE ID=?', [luid], (error, admins) => {
        if (error) {
            return res.status(500).json({error: 'Database query error'});
        }

        if (admins.length == 0 || admins[0].role != 'admin') {
            return res.status(403).json({error: 'You are not authorized to perform this action!'});
        }

        pool.query('SELECT ID FROM weather_forecasts WHERE ID=?', [weatherID], (error, results) => {
            if (error) {
                return res.status(500).json({error: 'Database query error'});
            }

            if (results.length == 0) {
                return res.status(400).json({error: 'Weather forecast with this ID does not exist!'});
            }

            pool.query('UPDATE weather_forecasts SET date=?, location=?, temp_min=?, temp_max=?, weather_type=?, precipitation=?, precipitation_probability=?, wind_speed=?, wind_direction=?, humidity=?, pressure=?, uv_index=?, updated_at=CURRENT_TIMESTAMP WHERE ID=?', [date, location, temp_min, temp_max, weather_type, precipitation ?? null, precipitation_probability ?? null, wind_speed ?? null, wind_direction ?? null, humidity ?? null, pressure ?? null, uv_index ?? null, weatherID], (error, results2) => {
                if (error) {
                    return res.status(500).json({error: 'Database query error'});
                }

                if (results2.affectedRows == 0) {
                    return res.status(400).json({error: 'Weather forecast with this ID does not exist!'});
                }

                return res.status(200).json({message: 'Weather forecast updated successfully!'});
            });
        });
    });
});



//elorejelzes torlese
app.delete('/admin/weather/:weatherID', (req, res) => {
    const { weatherID } = req.params;
    const { luid } = req.body;

    if (!luid) {
        return res.status(400).json({error: 'Missing admin user ID!'});
    }

    pool.query('SELECT ID, role FROM users WHERE ID=?', [luid], (error, admins) => {
        if (error) {
            return res.status(500).json({error: 'Database query error'});
        }

        if (admins.length == 0 || admins[0].role != 'admin') {
            return res.status(403).json({error: 'You are not authorized to perform this action!'});
        }

        pool.query('DELETE FROM weather_forecasts WHERE ID=?', [weatherID], (error, results) => {
            if (error) {
                return res.status(500).json({error: 'Database query error'});
            }

            if (results.affectedRows == 0) {
                return res.status(404).json({error: 'Forecast with this ID does not exist!'});
            }

            return res.status(200).json({message: 'Forecast deleted successfully!'});
        });
    });
});


app.get('/weather', (req, res) => {

    pool.query(`SELECT ID, date, location, temp_min, temp_max, weather_type, precipitation, precipitation_probability, wind_speed, wind_direction, humidity, pressure, uv_index,
        created_at, updated_at FROM weather_forecasts ORDER BY date, location`, (error, results) => {
        if (error) {
            return res.status(500).json({error: 'Database query error'});
        }

        return res.status(200).json({results: results});
    });
});
app.listen(port, () => {
    console.log(`A szerver fut a ${port} porton.`);
});