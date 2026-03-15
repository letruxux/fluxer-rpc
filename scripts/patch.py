import struct
import sys

with open(sys.argv[1], "r+b") as f:
    f.seek(0x3C)
    pe_offset = struct.unpack("<I", f.read(4))[0]
    f.seek(pe_offset + 0x5C)
    f.write(struct.pack("<H", 2))

# i dont remember where i copied this from but this patches an exe to launch with no console
