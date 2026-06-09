#!/bin/sh
# SUPERSEDED - DO NOT RUN
#
# 2026-06-03: This script was created from a misinterpretation of Darrell's
# "Yes I always want to do evening now" + "everything" messages. He clarified
# minutes later that he meant the OPPOSITE: everything that CAN be done now
# should be sent to him ASAP, NOT batched into one evening tick.
#
# The wf27 cron has been REVERTED in repo to its original 4x/day schedule
# (7am / 12pm / 5pm / 9pm CDT). The binding memory is now feedback-default-now-asap.
#
# DO NOT RUN this script. It would apply the wrong schedule to live n8n.
# Left here only as a paper-trail; will be removed in the next repo cleanup.

echo "This script has been SUPERSEDED. See agent memory feedback-default-now-asap."
echo "Do NOT apply. wf27 cron stays at 7am/12pm/5pm/9pm CDT per repo."
exit 1
