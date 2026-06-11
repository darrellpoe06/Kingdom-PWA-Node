#!/bin/sh
# Forced-command wrapper for the property-photos bridge key.
# sudo strips SSH_ORIGINAL_COMMAND, so we pass it as a SINGLE quoted argv
# element to the resolver (which whitelist-validates channel + int-parses the
# rest). The quoting prevents any shell re-interpretation of the client input.
exec sudo -n /usr/bin/python3 /volume1/PoeTech/scripts/property-photos.py "$SSH_ORIGINAL_COMMAND"
