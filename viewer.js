var consoleDiv = document.getElementById("console");
var win = document.getElementById("window");
var canvas = document.getElementById("canvas");
//var ctx = canvas.getContext('2d');
var clock = new THREE.Clock();

function ConPrint(str)
{
	consoleDiv.innerHTML += str + "</br>";
}

// Do Stuff

// Stats
var stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );

canvas.style.width ='100%';
canvas.style.height='100%';
canvas.width  = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

var renderer = null;
var scene = null;
var camera = null;
var controls = null;
var lights = [];
var model = null;
var clock = new THREE.Clock();

function RenderInit()
{	
	var WIDTH = canvas.width;
	var HEIGHT = canvas.height;

	renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
	renderer.setSize(canvas.width, canvas.height);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
    //renderer.clear();
	
	scene = new THREE.Scene();
	
	camera = new THREE.PerspectiveCamera(
		Menu.fov,
		WIDTH / HEIGHT,
		5,       
		3000
	);
	camera.position.set( -30, 20, 30 );
	camera.lookAt( scene.position );
	
	// Set up controls
	controls = new THREE.OrbitControls( camera );
	
	// Fog
	scene.fog = new THREE.Fog( 0x666666, 1000, 1000 );

    hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.3, 0.7, 0.3 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, -500, 0 );
    //scene.add( hemiLight );

	// Add lights
	lights.amb = new THREE.AmbientLight(0x666666);
	lights.amb.color.setRGB(0.859 * 0.2, 0.976 * 0.2, 1 * 0.2);
	scene.add(lights.amb);
	
	// Fill light
	lights.fill = new THREE.SpotLight(0x8AD8FF);
	lights.fill.position.set( 75, 70, 80 );
	lights.fill.target.position.set(0, 0, 0);
	lights.fill.shadowCameraNear = 1;
	lights.fill.shadowCameraFar = 200;
	lights.fill.shadowCameraVisible = true;
	//lights.fill.castShadow = true;
	lights.fill.intensity = 0.4;
	scene.add(lights.fill);
	
	lights.back = new THREE.SpotLight(0xFF697A);
	lights.back.position.set( 0, 50, -80 );
	lights.back.target.position.set(0, 0, 0);
	lights.back.shadowCameraNear = 1;
	lights.back.shadowCameraFar = 200;
	lights.back.shadowCameraVisible = true;
	//lights.back.castShadow = true;
	lights.back.intensity = 0.5;
	scene.add(lights.back);
	
	lights.key = new THREE.SpotLight(0xF6FF94);
	lights.key.position.set( -75, 70, 80 );
	lights.key.target.position.set(0, 2.5, 0);
	lights.key.shadowCameraNear = 1;
	lights.key.shadowCameraFar = 200;
	//lights.key.shadowCameraVisible = true;
	lights.key.castShadow = true;
	lights.key.intensity = 0.9;
	lights.key.shadowMapWidth = 2048;
	lights.key.shadowMapHeight = 2048;
    var d = 50;
    lights.key.shadowCameraLeft = -d;
    lights.key.shadowCameraRight = d;
    lights.key.shadowCameraTop = d;
    lights.key.shadowCameraBottom = -d;
    lights.key.shadowCameraFar = 3500;
    lights.key.shadowBias = -0.0001;
    lights.key.shadowDarkness = 0.35;
	scene.add(lights.key);


		
	// Test Cube
	/*var geometry = new THREE.CubeGeometry( 5, 10, 5 );
    var material = new THREE.MeshLambertMaterial( { color: 0xFFFFFF } );
    var mesh = new THREE.Mesh( geometry, material );
	mesh.position.set( 0, 5, 0 );
	mesh.castShadow = true;
    //mesh.receiveShadow = true;
    scene.add( mesh );*/

	// Ground
	var planeGeo = new THREE.PlaneGeometry(400, 400, 10, 10);
	var planeMat = new THREE.MeshPhongMaterial({color: 0xFFFFFF, side: THREE.DoubleSide/*, map: floorTexture*/});
	var plane = new THREE.Mesh(planeGeo, planeMat);
	planeMat.ambient = planeMat.color;
	plane.rotation.x = -Math.PI/2;
	plane.position.y = 0;
	plane.castShadow = true;
	plane.receiveShadow = true;
	scene.add(plane);

	THREE.utils.enableDebug(scene);
	
    ConPrint("-== RenderInit ==-");

    LoadModel();
}

function Render()
{
	stats.begin();
	
	var delta = clock.getDelta();
	controls.update(delta);
	renderer.render(scene, camera);
	
	stats.end();
	
	window.requestAnimationFrame(Render); 
}

var Menu = {};
Menu.fov = 75.0;
Menu.AmbLightIntsity = 0.02;
Menu.SpinModel = false;

function MakeUI()
{
	var MenuUI = new dat.GUI();
	var MenuUISettings = MenuUI.addFolder('Viewer Settings');
	MenuUISettings.open();
	var fovChanged = MenuUISettings.add(Menu, 'fov', 45, 120).name("Fov");
	var AmbLightIntsityChanged = MenuUISettings.add(Menu, 'AmbLightIntsity', 0.0, 1).name("Ambient Light");

    MenuUI.add(Menu, 'SpinModel').name("Spin Model");

	Menu.ToggleVoxelVolume = function()
    {
        if (model)
        {
            for (var i = 0; i < model.children.length; i++)
            {
                for (var eye = 0; eye < model.children[i].children.length; eye++)
                {
                    var child = model.children[i].children[eye];
                    if (child.name == "bbox")
                    {
                        child.visible = !child.visible;
                    }
                }
            }
        }
    };
	MenuUI.add(Menu, 'ToggleVoxelVolume').name("Toggle Volume");

	// UI funcs
	fovChanged.onChange(function(value)
	{
		camera.fov = value;
		camera.updateProjectionMatrix();
	});
	
	AmbLightIntsityChanged.onChange(function(value)
	{
		lights.amb.color.setRGB(0.859 * value, 0.976 * value, 1 * value);
	});

    MenuUI.add(Menu, 'OpenFile').name("Open File");
}

Menu.OpenFile = function()
{
    document.getElementById('theFile').click();
};

document.getElementById('theFile').addEventListener('change', function(e)
{
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e)
    {
        var contents = e.target.result;

        if (contents)
        {
            if (model)
                scene.remove(model);

            Voxii.LoadModel(file.name, function(mesh)
            {
                model = mesh;
                scene.add(mesh);
            }, contents);
        }
    };
    reader.readAsArrayBuffer(file);
}, false);

// Run the logic at a fixed rate
function RunLogic()
{
    var delta = clock.getDelta();

	if (Menu.SpinModel && model)
    {
        model.rotation.y += 1.2*delta;
    }
};

window.onresize=function()
{
	canvas.width = win.offsetWidth;
	canvas.height = win.offsetHeight;
	
	renderer.setSize(canvas.width, canvas.height);
	camera.aspect	= canvas.width / canvas.height;
	camera.updateProjectionMatrix();
};

function LoadModel()
{
	ConPrint("Load Model");

    var url = getParameterByName("model");
    if (url)
    {
        Voxii.LoadModel(url, function(mesh)
        {
            model = mesh;
            scene.add(mesh);
        });
    }
    else
    {
        Voxii.LoadModel("Models/chr_gumi.vox", function(mesh)
        {
            model = mesh;
            scene.add(mesh);
        });
    }
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// GO GO GO!!
RenderInit();
MakeUI();
setInterval(RunLogic, 10); // Start the logic loop
Render(); // Loop