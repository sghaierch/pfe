class APIFeatures{
    constructor(query,queryParams){
    //query hya response.data hya liste taaa users eli bech tarj3elna
    this.query=query;
    this.queryParams=queryParams;
    }
    filter(){
        let queryObj = { ...this.queryParams };
        const excludedFields = ["sort","page","limit"];
        excludedFields.forEach((el) => delete queryObj[el]);

         // On vérifie si le champ "username" existe dans les paramètres de la requête
        if (queryObj.name) {
        // Utilisation de l'opérateur $regex pour effectuer une recherche insensible à la casse
        queryObj.name = { $regex: queryObj.name, $options: 'i' }; // 'i' pour insensibilité à la casse
        }

        // const users = await User.find().where("name").equals(req.query.name);
        // const users = await User.find(req.query);
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(lt|lte|gt|gte)\b/g, (opt) => `$${opt}`);   
        // eli b rouge yetsamew expression réguliér
        //  \b manetha ken tal9ach wa7da mn 4 mat3awathhomchhh 
        //  w /g najoumou nal9aw deux opérateurs hakeka mouch awel op yo5rj ibadalhom lkoll
        //lt  "less than" : strictement inférieur à
        //lte "less than or equal" : inférieur ou égal à
        //gt  "greater than" : strictement supérieur à
        //gte "greater than or equal" : supérieur ou égal à
        this.query = this.query.find(JSON.parse(queryStr));
        return this;//5ater lina lezemna nraj3ou this(query w queryparams ) s7i7 queryparams just na9rawohom mais lezmina 5ater baad ki njiw naamlou sort lezemina bech te5dmenlna
    }

    sort(){
        if (this.queryParams.sort) {
            const sortBy = this.queryParams.sort.split(",").join(" ");//chine7i , w n3awthha bel espace 
            this.query = this.query.sort(sortBy);
          } else {
            this.query = this.query.sort("-created_at");
          }
          return this;
    }

   /* pagination(){
        const page = this.queryParams.page*1 || 1; // *1 ta3mel parse twali entier 
        const limit = this.queryParams.limit*1 || 3;
        const skip = (page-1)*limit;
        this.query = this.query.skip(skip).limit(limit);
        if(this.queryParams.page){
         const nbr = this.query.length();
          if(skip >= nbr){
            console.log("you have passed the limit !!!!");
          }
        }
        return this;
    }*/
   //mate5demch length lina

    pagination() {
        const page = this.queryParams.page * 1 || 1; // Convertir en entier
        const limit = this.queryParams.limit * 1 || 3;
        const skip = (page - 1) * limit;
    
        // Appliquer la pagination
        this.query = this.query.skip(skip).limit(limit);
    
        // Vérifier si la page dépasse le nombre total de documents
        if (this.queryParams.page) {
            this.query.model.countDocuments().then((nbr) => {
                if (skip >= nbr) {
                    console.log("You have passed the limit !!!!");
                }
            }).catch((err) => {
                console.error("Error counting documents:", err);
            });
        }
    
        return this;
    }
        
        
}
module.exports=APIFeatures;