// .vox slab format loading
//---------------------------
(function (Core)
{

    Core.LoadQb = function(view, dataLen)
    {
        var version = view.getInt32();
        var colorFormat = view.getInt32();
        var zAxisOrientation = view.getInt32();
        var compressed = view.getInt32();
        var visibilityMaskEncoded = view.getInt32();
        var numMatrices = view.getInt32();

        var models = [];
        // Only support one matrix for now
        for (var matID = 0; matID < numMatrices; matID++)
        {
            var voxelData = {};
            var matrixName = view.getString(view.getUint8());

            voxelData.dims =
            {
                x: view.getUint32(),
                y: view.getUint32(),
                z: view.getUint32()
            };

            voxelData.pos =
            {
                x: view.getInt32(),
                y: (view.getInt32()+voxelData.dims.y/2),
                z: view.getInt32()
            };

            var getColorIdx = function(color)
            {
                var mask = color >> 24 & 255;
                var colorIdx = voxelData.palette.indexOf(color);
                if (colorIdx == -1)
                {
                    voxelData.palette.push(color);
                    colorIdx = voxelData.palette.length-1;
                }

                colorIdx = (mask == 0) ? 255 : colorIdx;
                return colorIdx;
            };

            voxelData.voxels = new Uint8Array(voxelData.dims.x * voxelData.dims.y * voxelData.dims.z);
            voxelData.palette = [];

            if (compressed == 0)
            {
                for(z = 0; z < voxelData.dims.z; z++)
                {
                    for(y = 0; y < voxelData.dims.y; y++)
                    {
                        for(x = 0; x < voxelData.dims.x; x++)
                        {
                            voxelData.voxels[Core.get3dArrayIdx(voxelData.dims, x, y, z)] = getColorIdx(view.getUint32());
                        }
                    }
                }
            }
            else // if compressed
            {
                for (var z = 0; z < voxelData.dims.z; z++)
                {
                    var index = 0;

                    while (true)
                    {
                        var data = view.getUint32();

                        if (data == 6)
                            break;
                        else if (data == 2)
                        {
                            var count = view.getUint32();
                            data = view.getUint32();

                            for(j = 0; j < count; j++)
                            {
                                var x = index % voxelData.dims.x;
                                var y = Math.floor(index / voxelData.dims.x);
                                index++;

                                voxelData.voxels[Core.get3dArrayIdx(voxelData.dims, x, y, z)] = getColorIdx(data);
                            }
                        }
                        else
                        {
                            var x = index % voxelData.dims.x;
                            var y = Math.floor(index / voxelData.dims.x);
                            index++;

                            voxelData.voxels[Core.get3dArrayIdx(voxelData.dims, x, y, z)] = getColorIdx(data);
                        }
                    }
                }
            }

            //console.dir(voxelData);
            voxelData.nullColor = 255;
            voxelData.numColors = voxelData.palette.length;
            voxelData.rotateY = zAxisOrientation == 0 ? 0 : 270;
            models.push(voxelData);
        }


        return models;
    };

}(Voxii));