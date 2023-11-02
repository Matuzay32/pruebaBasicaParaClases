import express from 'express';
import mysql from 'mysql2/promise'; // Importa mysql2/promise para async/await
import cors from 'cors';

const app = express();

// Habilitar CORS
app.use(cors());
const port = 3000;

app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'local',
  database: 'local',
  port: 3001,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.post('/', async (req, res) => {
  const datos = req.body;
  const { name, apellido, edad, localidad, telefono, imagenes } = datos;

  console.log(datos);
  try {
    const connection = await pool.getConnection();

    const [results] = await connection.execute(
      'INSERT INTO Users (name, apellido, edad, localidad, telefono) VALUES (?, ?, ?, ?, ?)',
      [name, apellido, edad, localidad, telefono]
    );
    const userId = results.insertId; // Obtener el ID del usuario insertado

    // Insertar imágenes en la tabla "Imagenes" relacionadas con el usuario usando mysql2
    if (imagenes && imagenes.length > 0) {
      for (const imagen of imagenes) {
        await connection.execute(
          'INSERT INTO Imagenes (user_id, url) VALUES (?, ?)',
          [userId, imagen]
        );
      }
    }

    res
      .status(201)
      .json({ message: 'Usuario y sus imágenes insertados correctamente' });
  } catch (error) {
    console.error('Error al insertar usuario:', error);
    res.status(500).json({ error: 'Error al insertar usuario' });
  }
});

app.get('/:userId', async (req, res) => {
  const userId = req.params.userId;
  if (userId) {
    res.status(400).json({
      response: 'Ingrese numero de usuario del que quiere ver las imagenes ',
    });
  }

  try {
    // Realizar consulta para obtener imágenes usando mysql2
    const connection = await pool.getConnection();
    const [results] = await connection.execute(
      'SELECT url FROM Imagenes WHERE user_id = ?',
      [userId]
    );
    connection.release();

    const images = results.map((row) => row.url);
    res.status(200).json(images);
  } catch (error) {
    console.error('Error en la consulta:', error);
    res.status(500).json({ error: 'Error en la consulta a la base de datos' });
  }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
