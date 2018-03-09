
// PENDULUM VARIABLES ----------------------------------

// Pendulum 
var g = 9.82;
var b = 2.83;		//resistance
var l = 10;			//rod length
var m = 1000;		//mass of pendulum
var mc = 10;			//mass of cube

// Air resistance
var d = 1;							//Diameter
var A = Math.pow(d,2)*(Math.PI/4)	//Area
var rho = 1.2041;					//Air density
var C = 4.7;						//Drag coefficient
var D = 0.5*C*rho*A;				//Only for simplification

// Initial values
var h = 0.05;						//steplength
var omega = 0;
var theta = 0;
var vCube = 0;


// GEOMETRY VARIABLES ------------------------------------

var sphereRadius = 1;
var rodDiameter = 0.2;
var cubeSide = 2;

var sphere;
var rod;
var floor;
var brick;

// Height and length of wall
var numBricksHeight = 2;
var numBricksLength = 4;

var brickPos = new THREE.Vector3();
var centerWall;	
var brickWall = new Array(numBricksHeight*numBricksLength);


// SCENE ROOT --------------------------------------------

// Create scene root for transformations
var sceneRoot = new THREE.Group();
var pivotTranslate = new THREE.Group();
var rodSpin = new THREE.Group();
var rodTranslate = new THREE.Group();
var BallTranslate = new THREE.Group();

// Camera root
var cameraRoot = new THREE.Group();
var cameraRotation = new THREE.Group();
var cameraRotationUD = new THREE.Group();
var cameraTranslation = new THREE.Group();



// FUNCTIONS ---------------------------------------------

function onWindowResize() {
	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
};

// Change Start Angle
function changeAngle(angle){
	theta = angle;
	omega = 0;
};

// Reset functions
function resetCube() {
	var cCount = 0;
	brickPos.set(3,0,centerWall);
	
	for(var i = 0; i < numBricksHeight; i++){
		for(var j = 0; j < numBricksLength; j++){
			brickWall[cCount].position.set(brickPos.x, brickPos.y, brickPos.z);
			brickPos.z += cubeSide;
			brickWall[cCount].rotation.set(0,0,0);
			cCount++;
		}
		brickPos.y += cubeSide;
		brickPos.z = centerWall;
	}
	fallingCubes = 0;
};

function resetAll() {
	resetCube();
	
	fallingCubes = 0;
	theta = 0;
	omega = 0;
};


// Camera Rotation
function onDocumentKeyDown(event) {
    var keyCode = event.which;
	
	if(keyCode == 87){		//w	
		cameraRotationUD.rotation.x -= 0.05;
	}
	
	if(keyCode == 65){		//a
		cameraRotation.rotation.y -= 0.05;
	}
	
	if(keyCode == 83){		//s
		cameraRotationUD.rotation.x += 0.05;
	}
	
	if(keyCode == 68){		//d
		cameraRotation.rotation.y += 0.05;
	}

};

// Calculates velocity of pendulum and cube after collision
function intersect(massPend, massCube, Omega, length, vCube){
	
	vPend = ((Omega*length)*(massPend-massCube) + 2*massCube*vCube)/(massPend + massCube);
	vCube = (vCube*(massCube-massPend) + 2*massPend*Omega*length)/(massCube + massPend);
	thetacube = theta;
	C = new Array(vCube, vPend, thetacube);
	
	return C;
}


// SET UP SCENE --------------------------------------

function init(){
	
	// SCENE -------------------------------------------
	
	scene = new THREE.Scene();
	// Set up camera. PerspectiveCamera(FOV, aspect ratio, near, far)
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	// This is where the magic happens ;)
	renderer = new THREE.WebGLRenderer( {alpha: true});
	// Width/height of area on which we render app. Browser window size itc. For lower resolution: calling setSize with false as updateStyle (the third argument). 
	// For example, setSize(window.innerWidth/2, window.innerHeight/2, false) will render your app at half resolution, given that your <canvas> has 100% width and height.
	renderer.setSize( window.innerWidth, window.innerHeight); 
	// Add renderer element to HTML document.
	document.body.appendChild( renderer.domElement );
	

	
	// LIGHT ---------------------------------------------

	// Shading
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

	// PointLight( color, intensity, distance, decay )
	var lightSphere = new THREE.SphereGeometry(3, 16, 8);
	var light = new THREE.PointLight( 0xffffff, 1, 100, 1);
	light.add( new THREE.Mesh(lightSphere, new THREE.MeshBasicMaterial({color: 0xffff00})));
	light.position.set( 27, 27, 15 );
	light.castShadow = true;
	scene.add( light );

	// AmbientLight( color, intensity )
	var ambLight = new THREE.AmbientLight( 0x404040, 2 ); // soft white light
	scene.add( ambLight );

	// Set up shadow properties for the pointlight
	light.shadow.mapSize.width = 512;  // default
	light.shadow.mapSize.height = 512; // default
	light.shadow.camera.near = 0.5;       // default
	light.shadow.camera.far = 500;     // default

	//	WALL ------------------------------------------
	
	// Centers the wall, no matter length
	if(numBricksLength % 2 == 0)
		centerWall = -cubeSide*(numBricksLength/2)+(cubeSide/2);
	else
		centerWall = -cubeSide*((numBricksLength-1)/2);
	
	brickPos.set(3,0,centerWall);
	var bCount = 0;

	
	// Create wall of cubes
	for(var row = 0; row < numBricksHeight; row++){
		
		for(var i = 0; i < numBricksLength; i++){
			brickWall[bCount] = new THREE.BoxGeometry(cubeSide,cubeSide,cubeSide);
			var randColor = Math.floor( Math.random() * ( 1 << 22 ) );
			var brickMaterial = new THREE.MeshPhongMaterial( { wireframe: false, color: randColor,  } ); //800000
			
			brickWall[bCount] = new THREE.Mesh( brickWall[bCount], brickMaterial);
			brickWall[bCount].castShadow = true;
			brickWall[bCount].recieveShadow = true;

			scene.add(brickWall[bCount]);
			
			brickWall[bCount].position.set(brickPos.x, brickPos.y, brickPos.z);
			brickPos.z += cubeSide;

			bCount++;
		}
		brickPos.y += cubeSide;
		brickPos.z = centerWall;
	}
	
	//	GEOMETRY ------------------------------------------
	
	// Create the geometry and material of the object
	var floor = new THREE.BoxGeometry( 25, 1, 15 ); 
	var floormaterial = new THREE.MeshPhongMaterial( { wireframe: false, color: 0x2d8a2f,  } ); //800000

	var rodGeometry = new THREE.BoxGeometry( rodDiameter, l, rodDiameter);
	var rodmaterial = new THREE.MeshPhongMaterial( { wireframe: false, color: 0xffffff } ); 

	var sphereGeometry = new THREE.SphereGeometry(sphereRadius, 10, 10);
	var spherematerial = new THREE.MeshStandardMaterial( { wireframe: false, color: 0x4e4e4e, metalness: 0.6, roughness: 0.6} );
	
	// Create the ground
	floor = new THREE.Mesh( floor, floormaterial ); 
	floor.receiveShadow = true;

	// Create a sphere
	sphere = new THREE.Mesh( sphereGeometry, spherematerial);
	sphere.castShadow = true; //default is false
	sphere.receiveShadow = true; //default

	// Create a rod
	rod = new THREE.Mesh( rodGeometry, rodmaterial);
	rod.castShadow = true;
	
	// Add the geometry to the scene
	scene.add( floor ); 
	scene.add( sphere );
	scene.add( rod );
		
	// Window resize
	window.addEventListener( 'resize', onWindowResize, false );
	
	// Top-node
	scene.add(sceneRoot);
	scene.add(cameraRoot);
	
	// Camera branch
	cameraRoot.add(cameraRotation);
	cameraRotation.add(cameraRotationUD);
	cameraRotationUD.add(cameraTranslation);
	cameraTranslation.add(camera);
	
	// Change camera position (depth)
	document.addEventListener("keydown", onDocumentKeyDown, false);
	
	cameraTranslation.position.y = 8;
	cameraTranslation.position.z = 21;
	cameraRotation.rotation.y -= 0.3;
	
	// Pendulum branch
	sceneRoot.add( pivotTranslate);
	pivotTranslate.add(rodSpin);
	rodSpin.add( rodTranslate );
	rodTranslate.add( rod );
	rod.add( BallTranslate );
	BallTranslate.add( sphere );
	
	// Fixed transformations
	pivotTranslate.position.y = l+1.5;
	pivotTranslate.position.x = -1;
	rodTranslate.position.y = -l/2;
	BallTranslate.position.y = -((l/2)+(sphereRadius/2));
	floor.position.y = -1.5;
	
};

// RENDER AND ANIMATE ---------------------------------------------

// Variables used in render
var hit = new Array(numBricksHeight*numBricksLength);
hit.fill(false);
var fallingCubes = 0;
var spherePos = 0;

var vCubeArray = new Array();
var inc = 0;

function render(){
	
	// Euler linear air resistance model
	//theta = theta + h * omega;
	//omega = omega + h * ((-g/l)*Math.sin(theta)) - (b/(m*Math.pow(l,2)))*omega;
	
	// Euler quadratic air resistance model
	theta = theta + h * omega;
	omega = omega + h * (((-g/l)*Math.sin(theta)) - (D/m)*omega*Math.abs(omega)*Math.pow(l,2));
	
	// Collision
	var box1 = new THREE.Box3().setFromObject(sphere);
	
	// Intersection parameters
	var K = new Array(3);
	K = intersect(m,mc,omega,l,vCube);
	
	// Box collision
	for(var ni = 0; ni < brickWall.length; ni++){
		var box3 = new THREE.Box3().setFromObject(brickWall[ni]);
		collision = box1.intersectsBox(box3);
		
		// Gravity on cube
		if(brickWall[ni].position.y != 0){
			fallingCubes += Math.sqrt(2*9.82)/60;
			brickWall[ni].position.y -= fallingCubes;
			
			if(brickWall[ni].position.y < 0)
				brickWall[ni].position.y = 0;
		}	
	
			
		// If collision -> box is hit and omega(K[1] - angular velocity) reduced
		if(collision & omega >= 0){
			omega = K[1]/l; //velocity sphere / length
			spherePos = theta*l;
			
			if(brickWall[ni].position.x -cubeSide/2 < spherePos +d/2){
				brickWall[ni].position.x = spherePos +d/2;
			}
			
			hit[ni] = true;
		}
		
		
		// Move cubes if hit
		if(hit[ni]){
			
			// Friction
			var frictionForce = 0.3*9.82*mc; //Wood against stone
			var frictionV = Math.sqrt((2*frictionForce)/mc)/60;

			var vHitCube = K[0]/60;		//velocity cube / frames
			
			vCubeArray[inc]= vHitCube;
			inc++;
			
			// Cube velocity reduced by friction
			var vCubeFriction = (vCubeArray[0] -= frictionV);

			// If friction > cube velocity
			if(vCubeFriction < 0)
				vCubeFriction = 0;
			
			if(Math.sin(K[2])){
				brickWall[ni].position.x += Math.sin(K[2])*vCubeFriction;
				console.log("This");
			}
			else			
				brickWall[ni].position.x += vCubeFriction;
			
			// NOT PHYSICALLY CORRECT
			// Rotate cubes if pendulum hit is off center
  			if(brickWall[ni].position.z > sphere.position.z){
				brickWall[ni].rotation.y -= Math.cos(theta+45)*vCubeFriction;
				brickWall[ni].position.z += Math.cos(theta+45)*vCubeFriction;
			}
			if(brickWall[ni].position.z < sphere.position.z){
				brickWall[ni].rotation.y += Math.cos(theta+45)*vCubeFriction;
				brickWall[ni].position.z -= Math.cos(theta+45)*vCubeFriction;
			}
			else
				brickWall[ni].position.y += Math.cos(theta+45)*vCubeFriction;
			
			// Cube stops
			if(vCubeFriction <= 0){
				hit[ni] = false;
				inc = 0;
				vCubeArray.splice(1,vCubeArray.length-1);
			}
		}
		
		// Collision between cubes
 		for(var i = 0; i < ni; i++){
			if(brickWall[i].position.z - cubeSide/2 < brickWall[ni].position.z && 
				brickWall[ni].position.z < brickWall[i].position.z + cubeSide/2 &&
				brickWall[i].position.x - cubeSide/2 < brickWall[ni].position.x && 
				brickWall[ni].position.x < brickWall[i].position.x + cubeSide/2){
				
 				if(Math.abs(brickWall[ni].position.y - brickWall[i].position.y) < cubeSide){
					brickWall[ni].position.y = brickWall[i].position.y + cubeSide;
				}
			}
			
 			if(Math.abs(brickWall[ni].position.x - brickWall[i].position.x) < cubeSide && 
				brickWall[ni].position.y == brickWall[i].position.y && 
				Math.abs(brickWall[ni].position.z - brickWall[i].position.z) < cubeSide){
					
					if(Math.abs(brickWall[ni].position.x - brickWall[i].position.x) > Math.abs(brickWall[ni].position.z - brickWall[i].position.z))
						brickWall[ni].position.x = brickWall[i].position.x + cubeSide;
					else
						brickWall[ni].position.z = brickWall[i].position.z + cubeSide;
			}


		}//end of foor-loop
		
		
	}//end of for-loop

	
	// TRANSFORMATIONS -------------------
	
	// Pendulum rotation
	rodSpin.rotation.z = theta;
	

	// Render the scene
	renderer.render( scene, camera ); 
};

function animate() {
	requestAnimationFrame( animate ); 
	render();
};

// RUN ------------------------------------------------------------

init();
animate();


// ----------------------------------------------------------------
