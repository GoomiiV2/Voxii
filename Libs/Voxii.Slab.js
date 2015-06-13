// .vox slab format loading
//---------------------------
(function (Core)
{

    Core.LoadSlab = function(view, dataLen)
    {
        var voxelData = {};

        voxelData.dims =
        {
            x: view.getInt32(),
            y: view.getInt32(),
            z: view.getInt32()
        };

        voxelData.voxels = new Uint8Array(voxelData.dims.x * voxelData.dims.y * voxelData.dims.z);

        for (var x = 0; x < voxelData.dims.x; x++)
        {
            for (var y = 0; y < voxelData.dims.y; y++)
            {
                for (var z = voxelData.dims.z; z > 0; z--)
                {
                    var i = Core.get3dArrayIdx(voxelData.dims, x, y, z-1);
                    var colorIdx = view.getUint8();
                    voxelData.voxels[i] = colorIdx;
                }
            }
        }

        voxelData.palette = [];
        for (var i = 0; i < 256; i++)
        {
            var color = view.getUint8() | ((view.getUint8() & 0xff) << 8) | ((view.getUint8() & 0xff) << 16) | (255 & 0xff) << 24;
            voxelData.palette.push(color);
        }

        voxelData.nullColor = 255;
        voxelData.numColors = 256;
        voxelData.rotateY = 270;
        return [voxelData];
    };

}(Voxii));