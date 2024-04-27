const express = require('express'); 
const axios = require('axios'); 
const cors = require('cors');  
const mongoose = require('mongoose'); 
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing 
const app = express();
app.use(cors()); 
const PORT = process.env.PORT || 5000; 
let l,e;
const fun=async()=>{ 
 await mongoose 
   .connect("mongodb+srv://varshini:Varshini2003@cluster0.st30aiy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",{ bufferCommands: false, useNewUrlParser: true, useUnifiedTopology: true }) 
   .then(() => { console.log("Connected to MongoDB Successfully");l="Connected to MongoDB Successfully"}) 
   .catch((err) => { console.log(err);e=err.message });
}
fun();
const UserSchema = new mongoose.Schema({ 
  username: String, 
  password: String, 
  recentlyViewedArticles: [{title:String,description:String,url:String,imageUrl:String,category:String}] 
}); 
 
const User = new mongoose.model("User", UserSchema); 
 
app.use(express.json()); // Parse JSON bodies 
app.get('/',(req,res)=>{
  if(l!=undefined)
  return res.send(l);
  res.send(e);
})
// Fetch news articles 
app.get('/news', async (req, res) => { 
  try { 
    const { country } = req.query;  
    const response = await axios.get('https://newsapi.org/v2/top-headlines', { 
      params: { 
        apiKey: '48b12120b9cc4ccfb3be2b37f869bb9d', 
        country: country || 'in', 
        pageSize: 100, 
      }, 
    }); 
    res.json(response.data.articles); 
  } catch (error) { 
    console.error('Error fetching news:', error); 
    res.status(500).json({ error: error.message }); 
  } 
}); 
 
// User login 
app.post('/login', async (req, res) => { 
  try { 
    const user = await User.findOne({ username: req.body.username }); 
    if (!user) { 
      return res.status(400).json({error:'Invalid Username'}); 
    } 
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password); 
    if (!isPasswordValid) { 
      return res.status(400).json({error:'Invalid Password'}); 
    } 
    res.json({ message: 'Login successful', user }); 
  } catch (error) { 
    console.error('Error during login:', error); 
    res.status(500).json({ error: error.message }); 
  } 
}); 
 
// User signup 
app.post('/signup', async (req, res) => { 
  try { 
    const ue=/^[a-zA-Z]+[a-zA-Z0-9]*/; 
    if(!ue.test(req.body.username)) 
    return res.status(401).json({error:'Username not Valid'}); 
    const pe=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{8,}$/; 
    if(!pe.test(req.body.password)) 
    return res.status(402).json({error:'Password not Strong'}); 
    const existingUser = await User.findOne({ username: req.body.username }); 
    if (existingUser) { 
      console.log("Exsisting!!"); 
      return res.status(400).json({error:'Username Already Exists'}); 
    } 
    const hashedPassword = await bcrypt.hash(req.body.password, 10); 
    const newUser = new User({ username: req.body.username, password: hashedPassword }); 
    const result = await newUser.save(); 
    res.send(result) 
  } catch (error) { 
    console.error('Error during signup:', error); 
    res.status(500).json({ error: error.message }); 
  } 
}); 
 
app.post('/addRecentlyViewed', async (req, res) => { 
  try { 
    const { userId, article } = req.body; 
    //console.log(article); 
    const user = await User.findById(userId); 
    if (!user) { 
      return res.status(404).json({ error: 'User not found' }); 
    } 
    if (user.recentlyViewedArticles.length >= 50) { 
      user.recentlyViewedArticles.shift();  
    } 
    var a={ 
      title: article.title, 
      description: article.description, 
      url: article.url, 
      imageUrl: article.imageUrl, 
      category: article.category, 
    }; 
    console.log(a); 
    const art=await user.recentlyViewedArticles.findIndex((x)=>x.title===a.title) 
    if(art===-1){ 
    user.recentlyViewedArticles = [a, ...user.recentlyViewedArticles]; 
    await user.save(); 
    res.json({ message: 'Recently viewed article added successfully' }); 
    } 
    else{ 
      res.send("Article already viewed!!") 
    } 
  } catch (error) { 
    console.error('Error adding recently viewed article:', error); 
    res.status(500).json({ error: error.message }); 
  } 
}); 
app.get('/recentlyViewedArticles/:username', async (req, res) => { 
  try { 
    const user = await User.findOne({username:req.params.username}); 
    if (!user) { 
      return res.status(404).json({ error: 'User not found' }); 
    } 
    res.json({ recentlyViewedArticles: user.recentlyViewedArticles }); 
  } catch (error) { 
    console.error('Error fetching recently viewed articles:', error); 
    res.status(500).json({ error: error.message }); 
  } 
}); 
app.listen(PORT, () => { 
  console.log(`Server is running on port ${PORT}`); 
}); 
